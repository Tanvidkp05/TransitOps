import React, { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import SimpleBar from "simplebar-react";

//Import Components
import VerticalLayout from "./VerticalLayouts";
import TwoColumnLayout from "./TwoColumnLayout";
import { Container } from "reactstrap";
import HorizontalLayout from "./HorizontalLayout";
import { AuthContext } from "../context/AuthContext";

const Sidebar = ({ layoutType }) => {
    const { adminData } = useContext(AuthContext);

    useEffect(() => {
        var verticalOverlay =
            document.getElementsByClassName("vertical-overlay");
        if (verticalOverlay) {
            verticalOverlay[0].addEventListener("click", function () {
                document.body.classList.remove("vertical-sidebar-enable");
            });
        }
    });

    const addEventListenerOnSmHoverMenu = () => {
        console.log("Toggle button clicked!");
        const currentSize =
            document.documentElement.getAttribute("data-sidebar-size");
        console.log("Current sidebar size:", currentSize);

        // add listener Sidebar Hover icon on change layout from setting
        if (currentSize === "sm-hover") {
            console.log("Setting to sm-hover-active");
            document.documentElement.setAttribute(
                "data-sidebar-size",
                "sm-hover-active"
            );
        } else if (currentSize === "sm-hover-active") {
            console.log("Setting to sm-hover");
            document.documentElement.setAttribute(
                "data-sidebar-size",
                "sm-hover"
            );
        } else {
            console.log("Setting to sm-hover (from default)");
            document.documentElement.setAttribute(
                "data-sidebar-size",
                "sm-hover"
            );
        }

        const newSize =
            document.documentElement.getAttribute("data-sidebar-size");
        console.log("New sidebar size:", newSize);
    };

    return (
        <React.Fragment>
            <style>
                {`
                    /* Minimal Sidebar Styling */
                    .minimal-sidebar {
                        background: #224c99;
                        border-right: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    
                    .minimal-logo-box {
                        background: white;
                        border-bottom: 2px solid #224c99;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 15px;
                        height: 80px;
                    }
                    
                    /* Menu styling */
                    .menu-title {
                        color: rgba(255, 255, 255, 0.5) !important;
                        font-size: 10px;
                        font-weight: 500;
                        letter-spacing: 0.5px;
                        text-transform: uppercase;
                        padding: 15px 20px 8px;
                        margin-top: 5px;
                    }
                    
                    .navbar-nav .nav-item {
                        margin: 1px 8px;
                    }
                    
                    .navbar-nav .nav-link {
                        color: rgba(255, 255, 255, 0.8) !important;
                        font-size: 13px;
                        font-weight: 400;
                        padding: 4px 8px !important;
                        border-radius: 4px;
                        transition: background 0.2s;
                    }
                    
                    .navbar-nav .nav-link:hover {
                        background: rgba(255, 255, 255, 0.08);
                        color: #ffffff !important;
                    }
                    
                    .navbar-nav .nav-link.active {
                        background: rgba(53, 119, 241, 0.15);
                        color: #ffffff !important;
                        font-weight: 500;
                    }
                    
                    .navbar-nav .menu-link {
                        display: flex;
                        align-items: center;
                    }
                    
                    .navbar-nav .menu-link::after {
                        font-size: 16px;
                        opacity: 0.6;
                        transition: transform 0.2s;
                    }
                    
                    .navbar-nav .menu-link[aria-expanded="true"]::after {
                        transform: rotate(90deg);
                    }
                    
                    .menu-dropdown {
                        margin: 2px 0;
                        padding: 2px 0;
                    }
                    
                    .menu-dropdown .nav-link {
                        padding-left: 35px !important;
                        font-size: 12px;
                    }
                    
                    /* Icon spacing */
                    .navbar-nav i {
                        margin-right: 8px;
                    }
                    
                    /* Toggle button visibility */
                    .btn-vertical-sm-hover {
                        background: rgba(53, 119, 241, 0.1) !important;
                        border: 1px solid #224c99 !important;
                        border-radius: 4px !important;
                        padding: 4px 8px !important;
                        color: #224c99 !important;
                    }
                    
                    .btn-vertical-sm-hover:hover {
                        background: rgba(53, 119, 241, 0.2) !important;
                    }
                    
                    /* Collapsed Sidebar (sm or sm-hover) - Support both */
                    html[data-sidebar-size="sm"] .navbar-menu,
                    html[data-sidebar-size="sm-hover"] .navbar-menu,
                    body[data-sidebar-size="sm"] .navbar-menu,
                    body[data-sidebar-size="sm-hover"] .navbar-menu,
                    [data-sidebar-size="sm"] .navbar-menu,
                    [data-sidebar-size="sm-hover"] .navbar-menu {
                        width: 70px !important;
                    }
                    
                    html[data-sidebar-size="sm"] .main-content,
                    html[data-sidebar-size="sm-hover"] .main-content,
                    body[data-sidebar-size="sm"] .main-content,
                    body[data-sidebar-size="sm-hover"] .main-content,
                    [data-sidebar-size="sm"] .main-content,
                    [data-sidebar-size="sm-hover"] .main-content {
                        margin-left: 70px !important;
                    }
                    
                    html[data-sidebar-size="sm"] .navbar-nav .nav-link span,
                    html[data-sidebar-size="sm"] .navbar-nav .nav-link::after,
                    html[data-sidebar-size="sm-hover"] .navbar-nav .nav-link span,
                    html[data-sidebar-size="sm-hover"] .navbar-nav .nav-link::after,
                    [data-sidebar-size="sm"] .navbar-nav .nav-link span,
                    [data-sidebar-size="sm"] .navbar-nav .nav-link::after,
                    [data-sidebar-size="sm-hover"] .navbar-nav .nav-link span,
                    [data-sidebar-size="sm-hover"] .navbar-nav .nav-link::after {
                        display: none !important;
                    }
                    
                    html[data-sidebar-size="sm"] .navbar-nav .nav-link i,
                    html[data-sidebar-size="sm-hover"] .navbar-nav .nav-link i,
                    [data-sidebar-size="sm"] .navbar-nav .nav-link i,
                    [data-sidebar-size="sm-hover"] .navbar-nav .nav-link i {
                        font-size: 20px !important;
                        margin-right: 0 !important;
                    }
                    
                    html[data-sidebar-size="sm"] .navbar-nav .nav-link,
                    html[data-sidebar-size="sm-hover"] .navbar-nav .nav-link,
                    [data-sidebar-size="sm"] .navbar-nav .nav-link,
                    [data-sidebar-size="sm-hover"] .navbar-nav .nav-link {
                        justify-content: center !important;
                        text-align: center !important;
                        font-size: 0 !important;
                    }
                    
                    html[data-sidebar-size="sm"] .menu-title,
                    html[data-sidebar-size="sm-hover"] .menu-title,
                    [data-sidebar-size="sm"] .menu-title,
                    [data-sidebar-size="sm-hover"] .menu-title {
                        text-align: center !important;
                        font-size: 0 !important;
                    }
                    
                    html[data-sidebar-size="sm"] .menu-title span,
                    html[data-sidebar-size="sm-hover"] .menu-title span,
                    [data-sidebar-size="sm"] .menu-title span,
                    [data-sidebar-size="sm-hover"] .menu-title span {
                        display: none !important;
                        font-size: 0 !important;
                    }
                    
                    /* Hide ALL text content in collapsed state */
                    html[data-sidebar-size="sm"] .navbar-nav span,
                    html[data-sidebar-size="sm-hover"] .navbar-nav span,
                    [data-sidebar-size="sm"] .navbar-nav span,
                    [data-sidebar-size="sm-hover"] .navbar-nav span {
                        display: none !important;
                        font-size: 0 !important;
                    }
                    
                    /* Show only icons - restore font size for icons */
                    html[data-sidebar-size="sm"] .navbar-nav i,
                    html[data-sidebar-size="sm-hover"] .navbar-nav i,
                    [data-sidebar-size="sm"] .navbar-nav i,
                    [data-sidebar-size="sm-hover"] .navbar-nav i {
                        display: inline-block !important;
                        font-size: 20px !important;
                    }
                    
                    html[data-sidebar-size="sm"] .menu-dropdown,
                    html[data-sidebar-size="sm-hover"] .menu-dropdown,
                    [data-sidebar-size="sm"] .menu-dropdown,
                    [data-sidebar-size="sm-hover"] .menu-dropdown {
                        display: none !important;
                    }
                    
                    html[data-sidebar-size="sm"] .navbar-brand-box,
                    html[data-sidebar-size="sm-hover"] .navbar-brand-box,
                    [data-sidebar-size="sm"] .navbar-brand-box,
                    [data-sidebar-size="sm-hover"] .navbar-brand-box {
                        padding: 15px 5px !important;
                    }
                    
                    html[data-sidebar-size="sm"] .logo-lg,
                    html[data-sidebar-size="sm-hover"] .logo-lg,
                    [data-sidebar-size="sm"] .logo-lg,
                    [data-sidebar-size="sm-hover"] .logo-lg {
                        display: none !important;
                    }
                    
                    html[data-sidebar-size="sm"] .logo-sm,
                    html[data-sidebar-size="sm-hover"] .logo-sm,
                    [data-sidebar-size="sm"] .logo-sm,
                    [data-sidebar-size="sm-hover"] .logo-sm {
                        display: inline-block !important;
                    }
                    
                    /* Hover on individual item - show submenu */
                    html[data-sidebar-size="sm"] .nav-item:hover > .menu-link,
                    html[data-sidebar-size="sm-hover"] .nav-item:hover > .menu-link,
                    [data-sidebar-size="sm"] .nav-item:hover > .menu-link,
                    [data-sidebar-size="sm-hover"] .nav-item:hover > .menu-link {
                        position: relative !important;
                        width: 250px !important;
                        background-color: rgba(255, 255, 255, 0.1) !important;
                        z-index: 999 !important;
                        font-size: 13px !important;
                    }
                    
                    html[data-sidebar-size="sm"] .nav-item:hover > .menu-link span,
                    html[data-sidebar-size="sm-hover"] .nav-item:hover > .menu-link span,
                    [data-sidebar-size="sm"] .nav-item:hover > .menu-link span,
                    [data-sidebar-size="sm-hover"] .nav-item:hover > .menu-link span {
                        display: inline-block !important;
                        padding-left: 8px !important;
                        font-size: 13px !important;
                    }
                    
                    html[data-sidebar-size="sm"] .nav-item:hover > .menu-dropdown,
                    html[data-sidebar-size="sm-hover"] .nav-item:hover > .menu-dropdown,
                    [data-sidebar-size="sm"] .nav-item:hover > .menu-dropdown,
                    [data-sidebar-size="sm-hover"] .nav-item:hover > .menu-dropdown,
                    html[data-sidebar-size="sm"] .menu-dropdown:hover,
                    html[data-sidebar-size="sm-hover"] .menu-dropdown:hover,
                    [data-sidebar-size="sm"] .menu-dropdown:hover,
                    [data-sidebar-size="sm-hover"] .menu-dropdown:hover {
                        display: block !important;
                        position: absolute !important;
                        left: 70px !important;
                        top: 0 !important;
                        min-width: 200px !important;
                        max-width: 250px !important;
                        background: #224c99 !important;
                        box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.3) !important;
                        border-radius: 4px !important;
                        padding: 0 !important;
                        z-index: 1000 !important;
                        margin: 0 !important;
                    }
                    
                    /* Keep panel visible slightly after hover ends */
                    html[data-sidebar-size="sm"] .nav-item .menu-dropdown,
                    html[data-sidebar-size="sm-hover"] .nav-item .menu-dropdown,
                    [data-sidebar-size="sm"] .nav-item .menu-dropdown,
                    [data-sidebar-size="sm-hover"] .nav-item .menu-dropdown {
                        transition: opacity 0.2s ease 0.1s, visibility 0s linear 0.3s !important;
                    }
                    
                    html[data-sidebar-size="sm"] .nav-item:hover .menu-dropdown,
                    html[data-sidebar-size="sm-hover"] .nav-item:hover .menu-dropdown,
                    [data-sidebar-size="sm"] .nav-item:hover .menu-dropdown,
                    [data-sidebar-size="sm-hover"] .nav-item:hover .menu-dropdown {
                        transition-delay: 0s !important;
                    }
                    
                    /* Create invisible bridge between icon and panel to maintain hover */
                    html[data-sidebar-size="sm"] .nav-item .menu-dropdown::after,
                    html[data-sidebar-size="sm-hover"] .nav-item .menu-dropdown::after,
                    [data-sidebar-size="sm"] .nav-item .menu-dropdown::after,
                    [data-sidebar-size="sm-hover"] .nav-item .menu-dropdown::after {
                        content: '' !important;
                        position: absolute !important;
                        left: -70px !important;
                        top: 0 !important;
                        width: 70px !important;
                        height: 100% !important;
                        background: transparent !important;
                        z-index: -1 !important;
                    }
                    
                    /* Make nav-item fill full width to catch hover */
                    html[data-sidebar-size="sm"] .nav-item,
                    html[data-sidebar-size="sm-hover"] .nav-item,
                    [data-sidebar-size="sm"] .nav-item,
                    [data-sidebar-size="sm-hover"] .nav-item {
                        position: relative !important;
                    }
                    
                    /* Add group title header to dropdown */
                    html[data-sidebar-size="sm"] .nav-item:hover > .menu-dropdown::before,
                    html[data-sidebar-size="sm-hover"] .nav-item:hover > .menu-dropdown::before,
                    [data-sidebar-size="sm"] .nav-item:hover > .menu-dropdown::before,
                    [data-sidebar-size="sm-hover"] .nav-item:hover > .menu-dropdown::before {
                        content: attr(data-group-name) !important;
                        display: block !important;
                        padding: 10px 15px 8px !important;
                        background: rgba(0, 0, 0, 0.2) !important;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
                        font-size: 11px !important;
                        font-weight: bold !important;
                        color: white !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.5px !important;
                        border-radius: 4px 4px 0 0 !important;
                    }
                    
                    /* Adjust padding for dropdown items */
                    html[data-sidebar-size="sm"] .nav-item:hover > .menu-dropdown .nav-sm,
                    html[data-sidebar-size="sm-hover"] .nav-item:hover > .menu-dropdown .nav-sm,
                    [data-sidebar-size="sm"] .nav-item:hover > .menu-dropdown .nav-sm,
                    [data-sidebar-size="sm-hover"] .nav-item:hover > .menu-dropdown .nav-sm {
                        padding: 8px 0 !important;
                    }
                    
                    html[data-sidebar-size="sm"] .nav-item:hover > .menu-dropdown .nav-item,
                    html[data-sidebar-size="sm-hover"] .nav-item:hover > .menu-dropdown .nav-item,
                    [data-sidebar-size="sm"] .nav-item:hover > .menu-dropdown .nav-item,
                    [data-sidebar-size="sm-hover"] .nav-item:hover > .menu-dropdown .nav-item {
                        position: relative !important;
                        width: 100% !important;
                        margin: 0 !important;
                    }
                    
                    html[data-sidebar-size="sm"] .nav-item:hover > .menu-dropdown .nav-link,
                    html[data-sidebar-size="sm-hover"] .nav-item:hover > .menu-dropdown .nav-link,
                    [data-sidebar-size="sm"] .nav-item:hover > .menu-dropdown .nav-link,
                    [data-sidebar-size="sm-hover"] .nav-item:hover > .menu-dropdown .nav-link {
                        padding: 8px 15px !important;
                        width: 100% !important;
                        text-align: left !important;
                        justify-content: flex-start !important;
                        white-space: nowrap !important;
                        position: relative !important;
                        font-size: 12px !important;
                    }
                    
                    html[data-sidebar-size="sm"] .nav-item:hover > .menu-dropdown .nav-link span,
                    html[data-sidebar-size="sm-hover"] .nav-item:hover > .menu-dropdown .nav-link span,
                    [data-sidebar-size="sm"] .nav-item:hover > .menu-dropdown .nav-link span,
                    [data-sidebar-size="sm-hover"] .nav-item:hover > .menu-dropdown .nav-link span {
                        display: inline-block !important;
                        padding-left: 0 !important;
                        font-size: 12px !important;
                    }
                    
                    /* Prevent submenu items from creating their own nested panels */
                    html[data-sidebar-size="sm"] .nav-item:hover > .menu-dropdown .nav-item .menu-dropdown,
                    html[data-sidebar-size="sm-hover"] .nav-item:hover > .menu-dropdown .nav-item .menu-dropdown,
                    [data-sidebar-size="sm"] .nav-item:hover > .menu-dropdown .nav-item .menu-dropdown,
                    [data-sidebar-size="sm-hover"] .nav-item:hover > .menu-dropdown .nav-item .menu-dropdown {
                        position: static !important;
                        box-shadow: none !important;
                        background: transparent !important;
                        padding: 0 0 0 15px !important;
                        margin: 0 !important;
                        display: block !important;
                        left: auto !important;
                        top: auto !important;
                        min-width: auto !important;
                        max-width: none !important;
                        border-radius: 0 !important;
                    }
                    
                    /* Ensure nested items are always visible when parent is hovered */
                    html[data-sidebar-size="sm"] .nav-item:hover > .menu-dropdown .menu-dropdown,
                    html[data-sidebar-size="sm-hover"] .nav-item:hover > .menu-dropdown .menu-dropdown,
                    [data-sidebar-size="sm"] .nav-item:hover > .menu-dropdown .menu-dropdown,
                    [data-sidebar-size="sm-hover"] .nav-item:hover > .menu-dropdown .menu-dropdown {
                        display: block !important;
                    }
                    
                    /* Remove ::before for nested dropdowns */
                    html[data-sidebar-size="sm"] .nav-item:hover > .menu-dropdown .menu-dropdown::before,
                    html[data-sidebar-size="sm-hover"] .nav-item:hover > .menu-dropdown .menu-dropdown::before,
                    [data-sidebar-size="sm"] .nav-item:hover > .menu-dropdown .menu-dropdown::before,
                    [data-sidebar-size="sm-hover"] .nav-item:hover > .menu-dropdown .menu-dropdown::before {
                        display: none !important;
                    }
                    
                    /* Style nested menu items */
                    html[data-sidebar-size="sm"] .nav-item:hover > .menu-dropdown .nav-item .menu-dropdown .nav-link,
                    html[data-sidebar-size="sm-hover"] .nav-item:hover > .menu-dropdown .nav-item .menu-dropdown .nav-link,
                    [data-sidebar-size="sm"] .nav-item:hover > .menu-dropdown .nav-item .menu-dropdown .nav-link,
                    [data-sidebar-size="sm-hover"] .nav-item:hover > .menu-dropdown .nav-item .menu-dropdown .nav-link {
                        padding: 6px 15px 6px 30px !important;
                        font-size: 11px !important;
                        background: rgba(0, 0, 0, 0.1) !important;
                    }
                    
                    .navbar-nav .nav-link:hover {
                        background: rgba(255, 255, 255, 0.1);
                    }
                    
                    /* Chevron for menu items with children */
                    .navbar-nav .menu-link[data-bs-toggle="collapse"]:after {
                        content: "\\203A";
                        position: absolute;
                        right: 15px;
                        font-size: 28px !important;
                        font-weight: bold;
                        transition: transform 0.3s ease;
                        color: rgba(255, 255, 255, 1) !important;
                        margin-bottom: 10px !important;
                    }
                    
                    .navbar-nav .menu-link[data-bs-toggle="collapse"][aria-expanded="true"]:after {
                        transform: rotate(90deg);
                        color: rgba(255, 255, 255, 0.9);
                    }
                    
                    /* Scrollbar */
                    .simplebar-track.simplebar-vertical {
                        width: 4px;
                        background: rgba(255, 255, 255, 0.05);
                    }
                    
                    .simplebar-scrollbar::before {
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 4px;
                    }
                `}
            </style>
            <div className="app-menu navbar-menu minimal-sidebar">
                <div className="navbar-brand-box minimal-logo-box">
                    <Link to="/dashboard" className="logo logo-dark" style={{ textDecoration: "none" }}>
                        <span className="logo-sm" style={{
                            lineHeight: "60px",
                            fontSize: "20px",
                            fontWeight: "800",
                            letterSpacing: "-0.05em",
                            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                            background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        }}>
                            T
                        </span>
                        <span className="logo-lg" style={{
                            lineHeight: "60px",
                            fontSize: "22px",
                            fontWeight: "800",
                            letterSpacing: "-0.03em",
                            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                            background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        }}>
                            TransitOps
                        </span>
                    </Link>

                    <Link to="/dashboard" className="logo logo-light" style={{ textDecoration: "none" }}>
                        <span className="logo-sm" style={{
                            lineHeight: "60px",
                            fontSize: "20px",
                            fontWeight: "800",
                            letterSpacing: "-0.05em",
                            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                            background: "linear-gradient(135deg, #60a5fa 0%, #93c5fd 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        }}>
                            T
                        </span>
                        <span className="logo-lg" style={{
                            lineHeight: "60px",
                            fontSize: "22px",
                            fontWeight: "800",
                            letterSpacing: "-0.03em",
                            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                            background: "linear-gradient(135deg, #60a5fa 0%, #93c5fd 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        }}>
                            TransitOps
                        </span>
                    </Link>
                    <button
                        onClick={addEventListenerOnSmHoverMenu}
                        type="button"
                        className="btn btn-sm p-0 fs-20 header-item float-end btn-vertical-sm-hover"
                        id="vertical-hover"
                    >
                        <i className="ri-record-circle-line"></i>
                    </button>
                </div>
                {layoutType === "horizontal" ? (
                    <div id="scrollbar">
                        <Container fluid>
                            <div id="two-column-menu"></div>
                            <ul className="navbar-nav" id="navbar-nav">
                                <HorizontalLayout logo={adminData?.data.Logo} />
                            </ul>
                        </Container>
                    </div>
                ) : layoutType === "twocolumn" ? (
                    <React.Fragment>
                        <TwoColumnLayout
                            layoutType={layoutType}
                            logo={adminData?.data.Logo}
                        />
                        <div className="sidebar-background"></div>
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        <SimpleBar id="scrollbar" className="h-100">
                            <Container fluid>
                                <div id="two-column-menu"></div>
                                <ul className="navbar-nav" id="navbar-nav">
                                    <VerticalLayout layoutType={layoutType} />
                                </ul>
                            </Container>
                        </SimpleBar>
                        <div className="sidebar-background"></div>
                    </React.Fragment>
                )}
            </div>
            <div className="vertical-overlay"></div>
        </React.Fragment>
    );
};

export default Sidebar;
