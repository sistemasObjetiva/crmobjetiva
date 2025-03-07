import React from "react";
import { images,} from '../config/variables';

const FooterContainer: React.FC = () => {
  return (
    <div className="footerContainer">
      <img src={images.logo} alt="Logo" className="logo" />
    </div>
  );
};

export default FooterContainer;
