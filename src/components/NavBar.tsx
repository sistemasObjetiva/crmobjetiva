import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/NavBar.css";
import { routes } from "../config/variables";

// Definimos el tipo para las rutas
interface Route {
  path: string;
  name: string;
  rol?: string| null; // Opcional, ya que algunas rutas no tienen restricción de rol
}

// Definimos el tipo de props que recibirá el componente
interface NavbarProps {
  userRole?: string| null;
}

const Navbar: React.FC<NavbarProps> = ({ userRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLDivElement | null>(null);

  const toggleMenu = () => {
    setIsOpen((prevState) => !prevState);
  };

  // Cerrar el menú si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filtrar rutas basadas en el rol del usuario
  const filteredRoutes = routes.filter(
    (route: Route) => !route.rol || route.rol === userRole
  );

  return (
    <nav className="navbar">
      <div className="navbar-container" ref={navRef}>
        <button className="hamburger" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`nav-links mobile ${isOpen ? "open" : ""}`}>
          {filteredRoutes.map((route, index) => (
            <Link key={index} to={route.path} onClick={() => setIsOpen(false)}>
              {route.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
