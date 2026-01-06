import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGE_KEY = 'app_language';

export const useLanguage = () => {
    const { i18n } = useTranslation();
    const [language, setLanguage] = useState(i18n.language);

    // Initialize from local storage on mount
    useEffect(() => {
        const storedLang = localStorage.getItem(LANGUAGE_KEY);
        if (storedLang && storedLang !== i18n.language) {
            i18n.changeLanguage(storedLang);
            setLanguage(storedLang);
        }
    }, [i18n]);

    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
        setLanguage(lang);
        localStorage.setItem(LANGUAGE_KEY, lang);
    };

    return { language, changeLanguage };
};
