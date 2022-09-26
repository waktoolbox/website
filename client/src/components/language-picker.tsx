import {useTranslation} from "react-i18next";
import {Icon, MenuItem, Select} from "@mui/material";
import React, {useState} from "react";

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
    const [language, setLanguage] = useState(i18n.resolvedLanguage)

    return (
        <div className="languagePicker">
            <Select
                value={language}
                label={languages[i18n.resolvedLanguage].nativeName}
            >
                {Object.keys(languages).map((lng) => (
                    <MenuItem
                        onClick={() => {
                            i18n.changeLanguage(lng);
                            setLanguage(lng);
                        }}
                        value={lng}
                    >
                        <Icon>
                            <img src={`/flags/${lng}.svg`} alt={`flag_${lng}`}/>
                        </Icon>
                    </MenuItem>
                ))}
            </Select>

        </div>
    );
}

export default LanguagePicker;