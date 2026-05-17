import React from "react";
import { motion } from "framer-motion";

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

const PANDA_IMAGE = `data:image/webp;base64,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`;

function PandaPlaceholder() {
  return (
    <div className="absolute left-[-5.8vw] top-[-2vh] z-10 hidden h-[106vh] w-[47vw] min-w-[600px] overflow-visible lg:block">
      <img
        src={PANDA_IMAGE}
        alt="Панда с сигарой"
        className="h-full w-auto max-w-none object-contain object-left-top drop-shadow-[0_40px_80px_rgba(0,0,0,.55)]"
      />
    </div>
  );
}

function Button({ children, variant = "primary" }) {
  const isPrimary = variant === "primary";
  return (
    <a
      href="#"
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
    <main className="relative min-h-screen overflow-hidden bg-[#050506] font-sans text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_4%,rgba(3,105,67,.95),transparent_34%),radial-gradient(circle_at_48%_38%,rgba(0,74,88,.42),transparent_27%),radial-gradient(circle_at_96%_53%,rgba(42,6,3,.58),transparent_32%),linear-gradient(90deg,rgba(0,0,0,.12),rgba(0,0,0,.15)_48%,rgba(0,0,0,.78))]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.035)_0_1px,transparent_1px)] bg-[length:100%_114px] opacity-70" />

      <PandaPlaceholder />

      <header className="relative z-20 flex h-[108px] items-center justify-between border-b border-white/10 px-5 sm:px-8 lg:justify-end lg:px-[92px]">
        <div className="text-xl font-black tracking-[-0.06em] lg:hidden">PANDAVKADS</div>

        <nav className="hidden items-center gap-10 text-[14px] text-white/75 md:flex lg:mr-11">
          {navItems.map((item) => (
            <a key={item} href="#" className="transition hover:text-white">
              {item}
            </a>
          ))}
        </nav>

        <a
          href="#"
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

          <p className="mt-7 max-w-[760px] text-[clamp(22px,1.54vw,31px)] font-medium leading-[1.27] tracking-[-0.035em] text-white/90">
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
