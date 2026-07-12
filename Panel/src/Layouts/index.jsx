import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import withRouter from "../Components/Common/withRouter";

//import Components
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

const Layout = (props) => {
    const [headerClass, setHeaderClass] = useState("");
    const [layoutModeType, setLayoutModeType] = useState(() => {
        // Get saved theme from localStorage or default to "light"
        const savedTheme = localStorage.getItem("layoutMode");
        return savedTheme || "light";
    });

    // call dark/light mode
    const onChangeLayoutMode = (value) => {
        setLayoutModeType(value);
        // Save to localStorage
        localStorage.setItem("layoutMode", value);

        // Apply theme directly to document
        if (value === "dark") {
            document.documentElement.setAttribute("data-layout-mode", "dark");
            document.documentElement.setAttribute("data-sidebar", "dark");
        } else {
            document.documentElement.setAttribute("data-layout-mode", "light");
            document.documentElement.setAttribute("data-sidebar", "dark");
        }
    };

    // class add remove in header
    useEffect(() => {
        window.addEventListener("scroll", scrollNavigation, true);

        // Set layout type
        document.documentElement.setAttribute("data-layout", "vertical");
        // Apply saved theme on mount
        document.documentElement.setAttribute("data-layout-mode", layoutModeType);
        document.documentElement.setAttribute("data-sidebar", "dark");
        console.log("Layout set to vertical");
    }, [layoutModeType]);

    function scrollNavigation() {
        var scrollup = document.documentElement.scrollTop;
        if (scrollup > 50) {
            setHeaderClass("topbar-shadow");
        } else {
            setHeaderClass("");
        }
    }

    return (
        <React.Fragment>
            <div id="layout-wrapper">
                <Header
                    headerClass={headerClass}
                    layoutModeType={layoutModeType}
                    onChangeLayoutMode={onChangeLayoutMode}
                />
                <Sidebar layoutType="vertical" />
                <div className="main-content">
                    {props.children}
                    <Footer />
                </div>
            </div>
        </React.Fragment>
    );
};

Layout.propTypes = {
    children: PropTypes.any,
};

export default withRouter(Layout);
