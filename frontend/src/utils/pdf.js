import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const exportElementToPdf = async (element, fileName = "monthly-report.pdf") => {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff"
  });
  const imageData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const ratio = contentWidth / canvas.width;
  const contentHeight = canvas.height * ratio;

  pdf.addImage(imageData, "PNG", margin, margin, contentWidth, contentHeight);
  pdf.save(fileName);
};

