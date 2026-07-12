import React from "react";
import ProfileDropdown from "../Components/Common/ProfileDropdown";
import UniversalSearch from "../Components/Common/UniversalSearch";

const Header = ({ onChangeLayoutMode, layoutModeType, headerClass }) => {
    const toogleMenuBtn = () => {
        console.log("🍔 Hamburger button clicked!");
        var windowSize = document.documentElement.clientWidth;
        console.log("Window size:", windowSize);

        if (windowSize > 767)
            document.querySelector(".hamburger-icon").classList.toggle("open");

        //For collapse horizontal menu
        if (
            document.documentElement.getAttribute("data-layout") ===
            "horizontal"
        ) {
            console.log("Layout: horizontal");
            document.body.classList.contains("menu")
                ? document.body.classList.remove("menu")
                : document.body.classList.add("menu");
        }

        //For collapse vertical menu
        if (
            document.documentElement.getAttribute("data-layout") === "vertical"
        ) {
            console.log("Layout: vertical");
            if (windowSize < 1025 && windowSize > 767) {
                console.log("Window size 767-1025: toggling sm/''");
                document.body.classList.remove("vertical-sidebar-enable");
                document.documentElement.getAttribute("data-sidebar-size") ===
                    "sm"
                    ? document.documentElement.setAttribute(
                        "data-sidebar-size",
                        ""
                    )
                    : document.documentElement.setAttribute(
                        "data-sidebar-size",
                        "sm"
                    );
            } else if (windowSize > 1025) {
                console.log("Window size >1025: toggling lg/sm");
                document.body.classList.remove("vertical-sidebar-enable");
                const currentSize =
                    document.documentElement.getAttribute("data-sidebar-size");
                console.log("Current sidebar size:", currentSize);

                if (currentSize === "lg" || currentSize === null) {
                    console.log("Setting to sm");
                    document.documentElement.setAttribute(
                        "data-sidebar-size",
                        "sm"
                    );
                } else {
                    console.log("Setting to lg");
                    document.documentElement.setAttribute(
                        "data-sidebar-size",
                        "lg"
                    );
                }

                const newSize =
                    document.documentElement.getAttribute("data-sidebar-size");
                console.log("New sidebar size:", newSize);
            } else if (windowSize <= 767) {
                console.log("Window size <=767: mobile");
                document.body.classList.add("vertical-sidebar-enable");
                document.documentElement.setAttribute(
                    "data-sidebar-size",
                    "lg"
                );
            }
        }

        //Two column menu
        if (
            document.documentElement.getAttribute("data-layout") === "twocolumn"
        ) {
            console.log("Layout: twocolumn");
            document.body.classList.contains("twocolumn-panel")
                ? document.body.classList.remove("twocolumn-panel")
                : document.body.classList.add("twocolumn-panel");
        }
    };
    return (
        <React.Fragment>
            <header id="page-topbar" className="shadow-lg">
                <div className="">
                    <div
                        className="d-flex align-items-center justify-content-between"
                    // style={{height: "50px"}}
                    >
                        <div className="d-flex">
                            <button
                                onClick={toogleMenuBtn}
                                type="button"
                                className="btn btn-sm px-3 fs-16 header-item vertical-menu-btn topnav-hamburger"
                                id="topnav-hamburger-icon"
                            >
                                <span className="hamburger-icon">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </span>
                            </button>
                        </div>

                        <UniversalSearch />
                        <div className="d-flex align-items-center">
                            <ProfileDropdown />
                        </div>
                    </div>
                </div>
            </header>
        </React.Fragment>
    );
};

export default Header;
