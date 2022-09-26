import {useTranslation} from "react-i18next";

interface Language {
    nativeName: string;
}

const languages: { [key: string]: Language } = {
    en: {nativeName: 'English'},
    fr: {nativeName: 'Français'},
    es: {nativeName: 'Español'},
    pt: {nativeName: 'Português'},
}

function LanguagePicker() {
    const {i18n} = useTranslation();

    return (
        <div className="languagePicker">
            {Object.keys(languages).map((lng) => (
                <button key={lng} style={{fontWeight: i18n.resolvedLanguage === lng ? 'bold' : 'normal'}} type="submit"
                        onClick={() => i18n.changeLanguage(lng)}>
                    {languages[lng].nativeName}
                </button>
            ))}
        </div>
    );
}

export default LanguagePicker;