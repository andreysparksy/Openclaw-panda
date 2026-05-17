import React from "react";
import { motion } from "framer-motion";
import PANDA_IMAGE from "./panda.png";

const navItems = ["О нас", "Кейсы", "Контакты"];

function ArrowIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path
        d="M10 5.5L18.5 14L10 22.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PandaPlaceholder() {
  return (
    <div className="absolute left-[-2vw] top-[2vh] z-10 hidden h-[88vh] w-[34vw] min-w-[420px] overflow-visible lg:block">
      <img
        src={PANDA_IMAGE}
        alt="Панда с сигарой"
        className="h-full w-auto max-w-none object-contain object-left-top drop-shadow-[0_40px_80px_rgba(0,0,0,.55)] [image-rendering:-webkit-optimize-contrast]"
        style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
      />
    </div>
  );
}

function Button({ children, variant = "primary" }) {
  const isPrimary = variant === "primary";
  return (
    <a
      href="#"
      style={{ fontFamily: '"Montserrat", sans-serif' }}
      className={[
        "group flex h-[90px] w-full max-w-[370px] items-center justify-between px-9 text-[15px] font-medium tracking-[-0.02em] transition duration-300 md:px-10",
        isPrimary
          ? "bg-gradient-to-r from-[#064c6a] via-[#05b88f] to-[#9bd51d] text-white shadow-[0_20px_70px_rgba(0,190,140,.16)] hover:brightness-110"
          : "border border-white/10 bg-white/[0.045] text-white/90 backdrop-blur hover:border-white/25 hover:bg-white/[0.07]",
      ].join(" ")}
    >
      <span>{children}</span>
      <span className="transition-transform duration-300 group-hover:translate-x-1">
        <ArrowIcon />
      </span>
    </a>
  );
}

export default function PandavkadsHeroPreview() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050506] text-white" style={{ fontFamily: '"Murs Gothic", sans-serif' }}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_4%,rgba(3,105,67,.95),transparent_34%),radial-gradient(circle_at_48%_38%,rgba(0,74,88,.42),transparent_27%),radial-gradient(circle_at_96%_53%,rgba(42,6,3,.58),transparent_32%),linear-gradient(90deg,rgba(0,0,0,.12),rgba(0,0,0,.15)_48%,rgba(0,0,0,.78))]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.035)_0_1px,transparent_1px)] bg-[length:100%_114px] opacity-70" />

      <PandaPlaceholder />

      <header className="relative z-20 flex h-[108px] items-center justify-between border-b border-white/10 px-5 sm:px-8 lg:justify-end lg:px-[92px]">
        <div className="text-xl font-black tracking-[-0.06em] lg:hidden">PANDAVKADS</div>

        <nav className="hidden items-center gap-10 text-[14px] text-white/75 md:flex lg:mr-11" style={{ fontFamily: '"Montserrat", sans-serif' }}>
          {navItems.map((item) => (
            <a key={item} href="#" className="transition hover:text-white">
              {item}
            </a>
          ))}
        </nav>

        <a
          href="#"
          style={{ fontFamily: '"Montserrat", sans-serif' }}
          className="hidden h-[61px] items-center justify-center bg-gradient-to-r from-[#064c6a] via-[#09b891] to-[#9bd51d] px-8 text-[14px] font-medium text-white transition hover:brightness-110 sm:flex"
        >
          Получить коммерческое
        </a>
      </header>

      <section className="relative z-20 mx-auto flex min-h-[calc(100vh-108px)] max-w-[1818px] items-center px-5 py-16 sm:px-8 lg:ml-[44.4%] lg:max-w-none lg:items-start lg:px-0 lg:pb-0 lg:pt-[168px]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full"
        >
          <h1 className="max-w-[930px] text-[clamp(52px,7.45vw,150px)] font-black leading-[0.9] tracking-[-0.07em] text-[#f4f6f8]">
            PANDAVKADS
          </h1>

          <p style={{ fontFamily: '"Montserrat", sans-serif' }} className="mt-7 max-w-[760px] text-[clamp(22px,1.54vw,31px)] font-medium leading-[1.27] tracking-[-0.035em] text-white/90">
            Запускаем рекламу в VK Ads не с нуля, а на базе готовых проверенных связок: креативы, аудитории, офферы и посадочные гипотезы уже подготовлены и адаптируются под ваш проект.
          </p>

          <div className="mt-11 grid max-w-[760px] grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-8">
            <Button>Получить коммерческое</Button>
            <Button variant="secondary">Смотреть кейсы</Button>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
