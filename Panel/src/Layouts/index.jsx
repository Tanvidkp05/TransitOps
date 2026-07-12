import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import withRouter from "../Components/Common/withRouter";

//import Components
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

const Layout = (props) => {
    const [headerClass, setHeaderClass] = useState("");
    const [layoutModeType, setLayoutModeType] = useState("light");

    // call dark/light mode
    const onChangeLayoutMode = (value) => {
        setLayoutModeType(value);

        // Apply theme directly to document
        if (value === "dark") {
            document.documentElement.setAttribute("data-layout-mode", "dark");
        } else {
            document.documentElement.setAttribute("data-layout-mode", "light");
        }
    };

    // class add remove in header
    useEffect(() => {
        window.addEventListener("scroll", scrollNavigation, true);

        // Set layout type
        document.documentElement.setAttribute("data-layout", "vertical");
        console.log("Layout set to vertical");
    }, []);

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
