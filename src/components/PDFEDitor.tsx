"use client";
import React, { useState, useEffect, useRef } from "react";
import { fabric } from "fabric";
import { PDFDocumentProxy, getDocument } from "pdfjs-dist";
import html2canvas from "html2canvas";
import * as pdfjsLib from "pdfjs-dist";
import jsPDF from "jspdf";

const PDFEditor: React.FC = () => {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadPdfJs = async () => {
      const pdfjsWorker = await import(
        "pdfjs-dist/legacy/build/pdf.worker.entry"
      );
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;

      if (canvasWrapperRef.current) {
        const fabricCanvas = new fabric.Canvas("pdf-canvas", {
          selection: true, // Allow selection of objects
          preserveObjectStacking: true, // Preserve stack order for objects
        });
        canvasRef.current = fabricCanvas;
      }
    };

    loadPdfJs(); // Load pdfjs and worker
  }, []);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const loadingTask = getDocument(url);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      renderAllPages(pdf);
    }
  };

  const renderAllPages = async (pdf: PDFDocumentProxy) => {
    if (!canvasRef.current) return;

    const fabricCanvas = canvasRef.current;
    let canvasHeight = 0;

    // Render all pages on a single Fabric.js canvas
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext("2d");

      if (context) {
        await page.render({ canvasContext: context, viewport: viewport })
          .promise;

        const img = new fabric.Image(canvas, {
          left: 0,
          top: canvasHeight,
          selectable: false, // Make PDF background non-selectable
        });

        fabricCanvas.setHeight(canvasHeight + canvas.height);
        fabricCanvas.setWidth(canvas.width);
        fabricCanvas.add(img);
        canvasHeight += canvas.height;
      }
    }

    fabricCanvas.renderAll();
  };

  const handleAddText = () => {
    if (canvasRef.current) {
      const text = new fabric.IText("Sample Text", {
        left: 100,
        top: 100,
        fill: "#000000",
        fontSize: 20,
        editable: true, // Allows editing text on the canvas
        selectable: true, // Allow selection for dragging and resizing
      });
      canvasRef.current.add(text);
      canvasRef.current.setActiveObject(text); // Set the newly added text as active for easy manipulation
      canvasRef.current.renderAll(); // Render changes
    }
  };

  const handleEraseText = () => {
    if (canvasRef.current) {
      const activeObject = canvasRef.current.getActiveObject();
      if (activeObject) {
        canvasRef.current.remove(activeObject);
        canvasRef.current.renderAll(); // Render changes
      }
    }
  };

  const handleBlurEffect = () => {
    if (canvasRef.current) {
      const activeObject = canvasRef.current.getActiveObject();
      if (activeObject && activeObject instanceof fabric.Image) {
        const blurFilter = new fabric.Image.filters.Blur({
          blur: 0.2, // Set blur value; adjust as needed
        });
        activeObject.filters?.push(blurFilter);
        (activeObject as fabric.Image).applyFilters();
        canvasRef.current.renderAll();
      } else if (activeObject && activeObject instanceof fabric.IText) {
        // For text blur, we reduce the opacity as a workaround
        activeObject.set({ opacity: 0.5 }); // Adjust opacity to create a blur-like effect
        canvasRef.current.renderAll();
      }
    }
  };

  const handleSavePdf = async () => {
    if (canvasRef.current) {
      const pdf = new jsPDF();
      const fabricCanvas = canvasRef.current;
      const canvasElement = fabricCanvas.getElement() as HTMLCanvasElement;

      const canvasImage = await html2canvas(canvasElement);
      const imgData = canvasImage.toDataURL("image/png");

      // Use the correct overload of jsPDF.addImage with width and height
      const imgWidth = canvasImage.width;
      const imgHeight = canvasImage.height;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save("edited.pdf");
    }
  };

  return (
    <div className="w-screen">
      <input type="file" accept="application/pdf" onChange={handleFileUpload} className="w-60 mx-auto"/>
      <div className="flex justify-evenly my-10 px-20">
        <button onClick={handleAddText}>Add Text</button>
        <button onClick={handleEraseText}>Erase Object</button>
        <button onClick={handleBlurEffect}>Blur Object</button>
        <button onClick={handleSavePdf}>Save PDF</button>
      </div>
      <div ref={canvasWrapperRef}>
        <canvas id="pdf-canvas" width="600" height="400" ></canvas>
      </div>
    </div>
  );
};

export default PDFEditor;
