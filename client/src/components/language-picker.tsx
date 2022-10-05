import {useTranslation} from "react-i18next";
import {Icon, InputBase, MenuItem, Select, styled} from "@mui/material";
import React, {useState} from "react";

interface Language {
    nativeName: string;
}

const languages: { [key: string]: Language } = {
    en: {nativeName: 'English'},
    fr: {nativeName: 'Français'},
    // es: {nativeName: 'Español'},
    // pt: {nativeName: 'Português'},
}

export default function LanguagePicker() {
    const {i18n} = useTranslation();
    const [language, setLanguage] = useState(i18n.resolvedLanguage)

    return (
        <div className="languagePicker">
            <Select
                value={language}
                label={languages[i18n.resolvedLanguage].nativeName}
                input={<StyledSelectInput/>}
                MenuProps={MenuProps}
            >
                {Object.keys(languages).map((lng) => (
                    <MenuItem
                        key={lng}
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

const StyledSelectInput = styled(InputBase)(({theme}) => ({
    '& .MuiInputBase-input': {
        padding: '8px 0px 0px 8px',
        backgroundColor: '#172a30',
        borderRadius: 4,
        verticalAlign: 'middle'
    },
}));

const MenuProps = {
    PaperProps: {
        style: {
            backgroundColor: '#172a30',
        }
    }
}