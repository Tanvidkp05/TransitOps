import React from 'react';

//constants
import { layoutModeTypes } from "../../Components/constants/layout";

const LightDark = ({ layoutMode, onChangeLayoutMode }) => {

    const mode = layoutMode === layoutModeTypes['DARKMODE'] ? layoutModeTypes['LIGHTMODE'] : layoutModeTypes['DARKMODE'];

    return (
        <div className="ms-1 header-item d-none d-sm-flex">
            <button
                onClick={() => onChangeLayoutMode(mode)}
                type="button"
                className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle light-dark-mode"
                title={layoutMode === layoutModeTypes['LIGHTMODE'] ? "Switch to dark mode" : "Switch to light mode"}
            >
                {layoutMode === layoutModeTypes['DARKMODE'] ? (
                    <i className='ri-sun-fill fs-22'></i>
                ) : (
                    <i className='ri-moon-fill fs-22'></i>
                )}
            </button>
        </div>
    );
};

export default LightDark;