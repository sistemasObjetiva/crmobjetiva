import React from "react";
import { useAuthRole } from "../config/auth.tsx";
import "../styles/global.css";
import HeaderContainer from "../components/Header";
import FooterContainer from "../components/Footer";

const IndexPage: React.FC = () => {
  const { role, loading ,user} = useAuthRole();

  if (loading) return <p>Cargando...</p>;
  
console.log(role)
console.log(user)
  if (loading) return <p>Cargando...</p>;

  return (
    <>
      <div className="mainContainer">
        <HeaderContainer userRole={role} />
        <div className="contentContainer"></div>
        <FooterContainer />
      </div>
    </>
  );
};

export default IndexPage;
