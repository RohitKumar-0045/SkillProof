const { PDFParse } = require("pdf-parse");

const extractPdfText = async (pdfBuffer) => {
    if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
        throw new Error("Invalid or empty PDF file");
    }

    let parser;

    try {
        parser = new PDFParse({
            data: pdfBuffer
        });

        const result = await parser.getText();

        const text = result.text?.trim();

        if (!text) {
            throw new Error(
                "No readable text found in the PDF"
            );
        }

        return text;
    } catch (error) {
        console.error(
            "PDF extraction error:",
            error.message
        );

        throw new Error(
            "Could not extract text from the resume PDF"
        );
    } finally {
        if (parser) {
            await parser.destroy();
        }
    }
};

module.exports = {
    extractPdfText
};