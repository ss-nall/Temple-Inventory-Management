import { exportElementToPdf } from "../utils/pdf";

const PdfDownloadButton = ({ targetRef, fileName }) => {
  const handleClick = async () => {
    if (!targetRef?.current) return;
    await exportElementToPdf(targetRef.current, fileName);
  };

  return (
    <button type="button" onClick={handleClick} className="temple-button">
      Download PDF
    </button>
  );
};

export default PdfDownloadButton;

