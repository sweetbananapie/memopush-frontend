import { createI18n } from "vue-i18n";
import ru from "@/locales/ru.json";
// import en from "@/locales/en.json";
// import kz from "@/locales/kz.json";

type BaseSchema = typeof ru;
const checkSchema = (obj: BaseSchema) => obj;

const messages = {
  ru,
  // en: checkSchema(en), // проверка схемы через TS, чтобы подсветило ошибки в IDE
  // kz: checkSchema(kz), // проверка схемы через TS, чтобы подсветило ошибки в IDE
};

const i18n = createI18n({
  legacy: false, // чтобы использовать Composition API
  locale: "ru",
  fallbackLocale: "en",
  messages,
  pluralRules: {
    ru(choice, choicesLength) {
      if (choice === 0) {
        return 0;
      }

      const teen = choice > 10 && choice < 20;
      const endsWithOne = choice % 10 === 1;

      if (choicesLength < 4) {
        return !teen && endsWithOne ? 1 : 2;
      }
      if (!teen && endsWithOne) {
        return 1;
      }
      if (!teen && choice % 10 >= 2 && choice % 10 <= 4) {
        return 2;
      }

      return choicesLength < 4 ? 2 : 3;
    },
    en(choice) {
      if (choice === 0) {
        return 0;
      }

      return 1;
    },
  },
});

export const t = i18n.global.t; //  for autocomplete in t('...')

export default i18n;
