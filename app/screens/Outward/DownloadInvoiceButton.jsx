import React from "react";
import { TouchableOpacity, Alert, Text, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format } from "date-fns";

const generateInvoiceHTML = (outwardData) => {
  const hasGST = outwardData.productDetails?.some(product => product.gstPercentage > 0);
  const totalBaseAmount = outwardData.productDetails?.reduce((sum, product) =>
    sum + ((product.quantity || 0) * (product.productPrice || 0)), 0) || 0;
  const totalGSTAmount = outwardData.productDetails?.reduce((sum, product) =>
    sum + (parseFloat(product.gstAmount) || 0), 0) || 0;
  const amountInWords = convertToWords(Math.floor(hasGST ? outwardData.total : totalBaseAmount));

return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${hasGST ? 'TAX INVOICE' : 'Invoice'}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px;
            max-width: 1000px;
            margin: 0 auto;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
          }
          .company-info { 
            margin-bottom: 20px; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
          }
          th, td { 
            border: 1px solid black; 
            padding: 8px; 
            text-align: left; 
          }
          .amount-words { 
            margin: 20px 0; 
          }
          .footer { 
            margin-top: 20px; 
          }
          .details-table { 
            margin-bottom: 30px; 
          }
          .details-table td:first-child { 
            font-weight: bold; 
            width: 25%; 
          }
          .details-table td:nth-child(3) { 
            font-weight: bold; 
            width: 25%; 
          }
          .signature-section {
            margin-top: 50px;
            width: 100%;
            display: flex;
            justify-content: space-between;
          }
          .signature-column {
            width: 45%;
            text-align: center;
          }
          .signature-line {
            width: 100%;
            border-bottom: 1px solid black;
            margin-bottom: 10px;
            height: 60px;
          }
          .buyer-details {
            border: 1px solid black;
            padding: 10px;
            margin: 20px 0;
          }
          .buyer-details h3 {
            margin-top: 0;
          }
          .products-table th {
            background-color: #f5f5f5;
          }
          .declaration {
            margin: 20px 0;
            border: 1px solid black;
            padding: 10px;
          }
          .clearfix::after {
            content: "";
            clear: both;
            display: table;
          }
          .gst-summary {
            margin-top: 20px;
            border: 1px solid #000;
            padding: 10px;
          }
          .gst-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          .gst-table th, .gst-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
          }
          .generated-note {
            text-align: center;
            margin-top: 30px;
            font-style: italic;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${hasGST ? 'Sathes Dairy' : 'Sathes Dairy'}</h1>
             <p>Shop No.19, </p>
        <p>Surabhi Heights Warje Pune.</p>
        <p>Contact : +91-9850070134 </p>
        <p>Destination:
        ${outwardData.destination || 'Pune'}</p>
            <p>Invoice No: ${outwardData.invoiceNo}</p>
            <p>Date: ${new Date(outwardData.transportDetails?.transportDate).toLocaleDateString()}</p>
          </div>

          ${hasGST ? `
          <div class="gst-details">
            <p>GSTIN: ${outwardData.customerDetails?.address || 'N/A'}</p>
          </div>
          ` : ''}

          <div class="customer-details">
            <h3>Customer Details:</h3>
            <p>Name: ${outwardData.customerDetails?.name}</p>
            <p>Contact: ${outwardData.customerDetails?.contactNumber}</p>
            <p>Address: ${outwardData.customerDetails?.customerAddress}</p>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Sr.</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
                ${hasGST ? `
                <th>GST %</th>
                <th>GST Amt</th>
                <th>Total</th>
                ` : ''}
              </tr>
            </thead>
            <tbody>
              ${outwardData.productDetails?.map((product, index) => {
    const baseAmount = (product.quantity || 0) * (product.productPrice || 0);
    return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${product.name}</td>
                    <td>${product.quantity}</td>
                    <td>₹${product.productPrice}</td>
                    <td>₹${baseAmount.toLocaleString()}</td>
                    ${hasGST ? `
                    <td>${product.gstPercentage}%</td>
                    <td>₹${product.gstAmount?.toLocaleString()}</td>
                    <td>₹${product.totalAmount?.toLocaleString()}</td>
                    ` : ''}
                  </tr>
                `;
  }).join('')}
              
              <tr>
                <td colspan="${hasGST ? '4' : '4'}" style="text-align: right;"><strong>Sub Total</strong></td>
                <td>₹${totalBaseAmount.toLocaleString()}</td>
                ${hasGST ? `
                <td></td>
                <td>₹${totalGSTAmount.toLocaleString()}</td>
                <td>₹${outwardData.total.toLocaleString()}</td>
                ` : ''}
              </tr>
            </tbody>
          </table>

          ${hasGST ? `
          <div class="gst-summary">
            <h4>GST Summary</h4>
            <table class="gst-table">
              <tr>
                <th>Rate</th>
                <th>Taxable Value</th>
                <th>CGST</th>
                <th>SGST</th>
                <th>Total Tax</th>
              </tr>
              ${Array.from(new Set(outwardData.productDetails.map(p => p.gstPercentage)))
        .map(rate => {
          const products = outwardData.productDetails.filter(p => p.gstPercentage === rate);
          const taxableValue = products.reduce((sum, p) => sum + (p.quantity * p.productPrice), 0);
          const totalGST = products.reduce((sum, p) => sum + (parseFloat(p.gstAmount) || 0), 0);
          return `
                    <tr>
                      <td>${rate}%</td>
                      <td>₹${taxableValue.toLocaleString()}</td>
                      <td>₹${(totalGST / 2).toLocaleString()}</td>
                      <td>₹${(totalGST / 2).toLocaleString()}</td>
                      <td>₹${totalGST.toLocaleString()}</td>
                    </tr>
                  `;
        }).join('')}
            </table>
          </div>
          ` : ''}

          <div class="amount-words">
            <p><strong>Amount in words:</strong> ${amountInWords} Rupees Only</p>
          </div>

          <div class="declaration">
            <p><strong>Declaration:</strong></p>
            <p>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
            ${hasGST ? `<p>GST Note: CGST & SGST @ 9% each</p>` : ''}
          </div>

          <div class="signature-section">
            <div class="signature-column">
              <div class="signature-line"></div>
              <p>Customer's Seal and Signature</p>
              <p>Received the material in good condition</p>
            </div>
            <div class="signature-column">
              <div class="signature-line"></div>
              <p>for ${outwardData.source || 'Mumbai'}</p>
              <p>Authorised Signatory</p>
            </div>
          </div>
          
          <div class="generated-note">
            <p>This is a Computer Generated Invoice</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const convertToWords = (number) => {
  // Add your number to words conversion logic here
  // This is a placeholder - you should implement proper conversion
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(number).replace('₹', '') + ' Only';
};

const handleDownloadInvoice = async (outwardData) => {
  try {
    if (!outwardData) {
      throw new Error('Invalid invoice data: No data provided');
    }

    const htmlContent = generateInvoiceHTML(outwardData);

    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false
    });

    const isSharingAvailable = await Sharing.isAvailableAsync();

    if (isSharingAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Invoice ${outwardData.invoiceNo || 'N/A'}`,
        UTI: 'com.adobe.pdf'
      });
    } else {
      Alert.alert('Error', 'Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Error generating invoice:', error);
    Alert.alert('Error', `Failed to generate invoice: ${error.message}`);
  }
};

const DownloadInvoiceButton = ({ outwardData }) => (
  <TouchableOpacity
    style={[styles.button, styles.downloadButton]}
    onPress={() => handleDownloadInvoice(outwardData)}
  >
    <Icon name="file-download" size={20} color="#000" />
    <Text style={[styles.buttonText, { color: "#000" }]}>Download Invoice</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  downloadButton: {
    backgroundColor: '#FFB700',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default DownloadInvoiceButton;