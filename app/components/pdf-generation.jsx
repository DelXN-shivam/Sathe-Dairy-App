const generateInvoiceHTML = (inwardData) => {
    // Early return with basic HTML if data is invalid
    if (!inwardData || typeof inwardData !== 'object') {
      return `
        <!DOCTYPE html>
        <html>
          <body>
            <p>Error: Invalid invoice data</p>
          </body>
        </html>
      `;
    }
  
    // Safe access to product details with default empty array
    const productDetails = Array.isArray(inwardData.productDetails) 
      ? inwardData.productDetails 
      : [];
  
    // Safe calculation of totals
    const calculateSubtotal = () => {
      if (productDetails.length === 0) return '0.00';
      
      return productDetails.reduce((total, product) => {
        if (!product) return total;
        const quantity = parseFloat(product.quantity || '0');
        const rate = parseFloat(product.productRate || '0');
        return total + (quantity * rate);
      }, 0).toFixed(2);
    };
  
    const subtotal = calculateSubtotal();
    const gst = (parseFloat(subtotal) * 0.18).toFixed(2);
    const total = (parseFloat(subtotal) + parseFloat(gst)).toFixed(2);
  
    // Safe date formatting
    const formatDate = (dateString) => {
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      } catch {
        return 'N/A';
      }
    };
  
    // Safe access to nested objects
    const supplierDetails = inwardData.supplierDetails || {};
    const transportDetails = inwardData.transportDetails || {};
  
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica'; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; color: #0CC0DF; }
            .section { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .total-section { text-align: right; margin-top: 20px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Inward Receipt</div>
            <div>Invoice No: ${inwardData.invoiceNo || 'N/A'}</div>
            <div>Date: ${formatDate(inwardData.date)}</div>
          </div>
  
          <div class="section">
            <h3>Supplier Details</h3>
            <p>
              Name: ${supplierDetails.supplierName || 'N/A'}<br/>
              Mobile: ${supplierDetails.supplierMobileNo || 'N/A'}<br/>
              Email: ${supplierDetails.supplierEmailId || 'N/A'}<br/>
              GST No: ${supplierDetails.supplierGSTNo || 'N/A'}<br/>
              Address: ${supplierDetails.supplierAddress || 'N/A'}
            </p>
          </div>
  
          <div class="section">
            <h3>Transport Details</h3>
            <p>
              Vehicle Number: ${transportDetails.vehicleNumber || 'N/A'}<br/>
              Vehicle Type: ${transportDetails.vehicleType || 'N/A'}<br/>
              Driver Mobile: ${transportDetails.driverMobileNumber || 'N/A'}
            </p>
          </div>
  
          <div class="section">
            <h3>Product Details</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Code</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${productDetails.map(product => {
                  if (!product) return '';
                  const quantity = parseFloat(product.quantity || '0');
                  const rate = parseFloat(product.productRate || '0');
                  const amount = (quantity * rate).toFixed(2);
                  return `
                    <tr>
                      <td>${product.name || 'N/A'}</td>
                      <td>${product.productCode || 'N/A'}</td>
                      <td>${quantity}</td>
                      <td>₹${rate}</td>
                      <td>₹${amount}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
  
          <div class="total-section">
            <p>
              Subtotal: ₹${subtotal}<br/>
              GST (18%): ₹${gst}<br/>
              <strong>Total Amount: ₹${total}</strong>
            </p>
          </div>
  
          <div class="footer">
            <p>This is a computer-generated document. No signature required.</p>
          </div>
        </body>
      </html>
    `;
  };
  
  // Updated PDF generation function with better error handling
  const generateAndSharePDF = async (inwardData) => {
    try {
      // Validate input data
      if (!inwardData || typeof inwardData !== 'object') {
        throw new Error('Invalid inward data provided');
      }
  
      // Generate HTML with safe handling
      const html = generateInvoiceHTML(inwardData);
      
      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });
  
      // Handle sharing based on platform
      if (Platform.OS === "ios") {
        await Sharing.shareAsync(uri);
      } else {
        // For Android, copy to shared location
        const fileName = `invoice_${inwardData.invoiceNo || Date.now()}.pdf`;
        const destinationUri = FileSystem.documentDirectory + fileName;
        
        await FileSystem.copyAsync({
          from: uri,
          to: destinationUri
        });
  
        return destinationUri;
      }
  
      return uri;
    } catch (error) {
      console.error('Error in generateAndSharePDF:', error);
      throw new Error('Failed to generate PDF: ' + error.message);
    }
  };
  
  export { generateInvoiceHTML, generateAndSharePDF };