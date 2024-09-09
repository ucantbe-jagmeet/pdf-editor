import React from "react";
import dynamic from "next/dynamic";
import PDFEditor from "../components/PDFEDitor";


const Home: React.FC = () => {
  return (
    <div>
      <h1>PDF Editor</h1>
      <PDFEditor />
    </div>
  );
};

export default Home;
