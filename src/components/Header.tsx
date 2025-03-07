import React from "react";
import { images } from "../config/variables";
import { Link } from "react-router-dom";
import NavBar from "./NavBar";

// Definimos los tipos de las props
interface HeaderContainerProps {
  title?: string;
  icon?: string;
  userRole?: string | null;
}

const HeaderContainer: React.FC<HeaderContainerProps> = ({ title, icon, userRole }) => {
  return (
    <>
      <Link to="/index">
        <div className="headerContainer">
          <img src={images.logo} alt="Logo" className="logo" />
        </div>
      </Link>

      {/* Solo renderizar si hay un título o icono */}
      {(title || icon) && (
        <div className="pageTitleContainer">
          {icon && <img src={icon} alt={`${title || "Icon"} Icon`} className="pageIcon" />}
          {title && <h1 className="pageTitle">{title}</h1>}
        </div>
      )}

      <NavBar userRole={userRole} />
    </>
  );
};

export default HeaderContainer;
