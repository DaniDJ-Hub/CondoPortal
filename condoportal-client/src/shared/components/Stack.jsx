// Baraja de tarjetas arrastrables — diseño de Frontend 1.
//
// Se usa en el Marketplace para el carrusel de fotos: la tarjeta de encima se
// arrastra (o se pulsa) y pasa al fondo del montón. Los estilos viven en
// styles/animaciones.css.

// `motion` se renombra a `Motion` porque la regla no-unused-vars del proyecto
// sólo perdona los identificadores que empiezan por mayúscula, y aquí no hay
// plugin de React que detecte su uso dentro del JSX.
import { motion as Motion, useMotionValue, useTransform } from 'motion/react';
import { useState, useEffect } from 'react';

// Inclinación de reparto para `randomRotation`. Es un valor sorteado a partir
// del número de tarjeta en vez de con Math.random(): da el mismo desorden a la
// vista, pero cada tarjeta conserva su ángulo entre repintados (el original
// sorteaba dentro del render y las cartas se movían solas).
function giroDe(id) {
  const ruido = Math.sin(id * 12.9898) * 43758.5453;
  return (ruido - Math.floor(ruido)) * 10 - 5;
}

function CardRotate({ children, onSendToBack, sensitivity, disableDrag = false }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [60, -60]);
  const rotateY = useTransform(x, [-100, 100], [-60, 60]);

  function handleDragEnd(_, info) {
    if (Math.abs(info.offset.x) > sensitivity || Math.abs(info.offset.y) > sensitivity) {
      onSendToBack();
    } else {
      x.set(0);
      y.set(0);
    }
  }

  if (disableDrag) {
    return (
      <Motion.div className="card-rotate-disabled" style={{ x: 0, y: 0 }}>
        {children}
      </Motion.div>
    );
  }

  return (
    <Motion.div
      className="card-rotate"
      style={{ x, y, rotateX, rotateY }}
      drag
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.6}
      whileTap={{ cursor: 'grabbing' }}
      onDragEnd={handleDragEnd}
    >
      {children}
    </Motion.div>
  );
}

export default function Stack({
  randomRotation = false,
  sensitivity = 200,
  cards = [],
  animationConfig = { stiffness: 260, damping: 20 },
  sendToBackOnClick = false,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  mobileClickOnly = false,
  mobileBreakpoint = 768
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [mobileBreakpoint]);

  const shouldDisableDrag = mobileClickOnly && isMobile;
  const shouldEnableClick = sendToBackOnClick || shouldDisableDrag;

  // El original traía cuatro fotos de Unsplash como relleno. Se quitaron: aquí
  // las tarjetas siempre llegan por prop y no queremos peticiones a terceros.
  const armar = (lista) => lista.map((content, index) => ({ id: index + 1, content }));

  const [stack, setStack] = useState(() => armar(cards));

  // Cuando cambia la lista de fotos hay que rehacer el montón. Se ajusta
  // durante el render —el patrón que documenta React para estado derivado— en
  // vez de en un efecto, que provocaría un render de más por cada cambio.
  // De paso, al quedarse sin fotos el montón se vacía: el original ignoraba
  // el caso de lista vacía y dejaba la última imagen pegada.
  const [cardsPrevias, setCardsPrevias] = useState(cards);
  if (cardsPrevias !== cards) {
    setCardsPrevias(cards);
    setStack(armar(cards));
  }

  const sendToBack = id => {
    setStack(prev => {
      const newStack = [...prev];
      const index = newStack.findIndex(card => card.id === id);
      const [card] = newStack.splice(index, 1);
      newStack.unshift(card);
      return newStack;
    });
  };

  useEffect(() => {
    if (autoplay && stack.length > 1 && !isPaused) {
      const interval = setInterval(() => {
        const topCardId = stack[stack.length - 1].id;
        sendToBack(topCardId);
      }, autoplayDelay);

      return () => clearInterval(interval);
    }
  }, [autoplay, autoplayDelay, stack, isPaused]);

  return (
    <div
      className="stack-container"
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {stack.map((card, index) => {
        const randomRotate = randomRotation ? giroDe(card.id) : 0;
        return (
          <CardRotate
            key={card.id}
            onSendToBack={() => sendToBack(card.id)}
            sensitivity={sensitivity}
            disableDrag={shouldDisableDrag}
          >
            <Motion.div
              className="card"
              onClick={() => shouldEnableClick && sendToBack(card.id)}
              animate={{
                rotateZ: (stack.length - index - 1) * 4 + randomRotate,
                scale: 1 + index * 0.06 - stack.length * 0.06,
                transformOrigin: '90% 90%'
              }}
              initial={false}
              transition={{
                type: 'spring',
                stiffness: animationConfig.stiffness,
                damping: animationConfig.damping
              }}
            >
              {card.content}
            </Motion.div>
          </CardRotate>
        );
      })}
    </div>
  );
}
