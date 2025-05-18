import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format } from "date-fns";
import getEnvVars from '../../../config/environment';

const { API_URL } = getEnvVars();

// Utility functions for invoice generation
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount).replace("INR", "₹");
};

const convertToWords = (number) => {
  const single = ["", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if (number === 0) return "Zero";

  const numStr = number.toString();
  const len = numStr.length;

  if (len === 0) return "";

  if (number < 20) return single[number];

  if (len === 2) {
    return tens[parseInt(numStr[0])] + " " + single[parseInt(numStr[1])];
  }

  if (len === 3) {
    if (numStr[1] === '0' && numStr[2] === '0')
      return single[parseInt(numStr[0])] + "Hundred ";
    else
      return single[parseInt(numStr[0])] + "Hundred " + convertToWords(parseInt((numStr[1] + numStr[2])));
  }

  if (len === 4) {
    const lastThree = parseInt((numStr[1] + numStr[2] + numStr[3]));
    if (lastThree === 0)
      return single[parseInt(numStr[0])] + "Thousand ";
    else
      return single[parseInt(numStr[0])] + "Thousand " + convertToWords(lastThree);
  }

  if (len === 5) {
    const lastThree = parseInt((numStr[2] + numStr[3] + numStr[4]));
    const firstTwo = parseInt((numStr[0] + numStr[1]));
    if (lastThree === 0)
      return convertToWords(firstTwo) + "Thousand ";
    else
      return convertToWords(firstTwo) + "Thousand " + convertToWords(lastThree);
  }

  return numStr;
};

const generateInvoiceHTML = (inwardData) => {
  const totalQuantity = inwardData.productDetails?.reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0) || 0;
  const amountInWords = convertToWords(Math.floor(inwardData.amount || 0));
  const hasGST = inwardData.productDetails?.some(product => parseInt(product.gstAmount) > 0);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #000;
            padding: 20px;
          }
          
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
          }
          
          .company-info {
            margin-bottom: 20px;
          }
          
          .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          
          .detail-row {
            display: flex;
            margin-bottom: 8px;
          }
          
          .detail-label {
            width: 150px;
            font-weight: bold;
          }
          
          .buyer-details {
            border: 1px solid #000;
            padding: 15px;
            margin-bottom: 20px;
          }
          
          .buyer-details h3 {
            margin: 0 0 10px 0;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          
          th {
            background-color: #f5f5f5;
          }
          
          .amount-words {
            border: 1px solid #000;
            padding: 10px;
            margin-bottom: 20px;
          }
          
          .declaration {
            border: 1px solid #000;
            padding: 10px;
            margin-bottom: 20px;
            font-size: 0.9em;
          }
          
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 40px;
          }
          
          .signature-box {
            text-align: center;
          }
          
          .signature-line {
            border-top: 1px solid #000;
            margin-top: 50px;
            padding-top: 5px;
          }
          
          .footer {
            text-align: center;
            margin-top: 20px;
            font-style: italic;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
              <div class="header">
        <h1>Sathe's Dairy</h1>
        <p>Shop No.19, </p>
        <p>Surabhi Heights Warje Pune.</p>
        <p>Contact : +91-9850070134 </p>
        <p>${inwardData.destination || 'Pune'}</p>
      </div>
          
          <div class="company-info">
            <div>GSTIN/UIN: ${inwardData.supplierDetails.supplierGSTNo || 'N/A'}</div>
            <div>State Name: ${inwardData.supplierDetails?.supplierAddress}</div>
          </div>
          
          <div class="invoice-details">
            <div>
              <div class="detail-row">
                <span class="detail-label">Invoice No:</span>
                <span>${inwardData.invoiceNo || 'N/A'}</span>
              </div>
              <div class="detail-row">
               <span class="detail-label">Dated:</span>
                <span>${new Date(inwardData.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Delivery Note:</span>
                <span>N/A</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Reference No:</span>
                <span>${inwardData.referenceNo || 'N/A'}</span>
              </div>
            </div>
            
            <div>
              <div class="detail-row">
                <span class="detail-label">Mode of Payment:</span>
                <span>${inwardData.paymentMode || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Vehicle No:</span>
                <span>${inwardData.transportDetails?.vehicleNumber || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Destination:</span>
                <span>${inwardData.destination || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Other Reference:</span>
                <span>N/A</span>
              </div>
            </div>
          </div>
          
          <div class="buyer-details">
            <h3>Buyer Details:</h3>
            <div>Name: ${inwardData.supplierDetails?.name || 'N/A'}</div>
            <div>Contact: ${inwardData.supplierDetails?.contactNumber || 'N/A'}</div>
            <div>Address: ${inwardData.supplierDetails?.address || 'N/A'}</div>
            <div>Email: ${inwardData.supplierDetails?.email || 'N/A'}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>SI No.</th>
                <th>Description of Goods</th>
                <th>HSN/SAC</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Per</th>
                <th>Amount</th>
                ${hasGST ? `
                <th>GST %</th>
                <th>GST Amt</th>
                <th>Total</th>
                ` : ''}
              </tr>
            </thead>
            <tbody>
              ${inwardData.productDetails?.map((product, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${product.name || 'N/A'}</td>
                  <td>${product.hsnCode || 'N/A'}</td>
                  <td>${product.quantity || 0}</td>
                  <td>${formatCurrency(product.productRate || 0)}</td>
                  <td>KG</td>
                  <td>${formatCurrency((product.productRate || 0) * (product.quantity || 0))}</td>
                  ${hasGST ? `
                  <td>${parseInt(product.gstPercentage) === 0 ? '-' : product.gstPercentage + '%'}</td>
                  <td>${parseInt(product.gstAmount) === 0 ? '-' : formatCurrency(product.gstAmount)}</td>
                  <td>${formatCurrency(parseInt(product.gstAmount) === 0 ?
    (product.productRate * product.quantity) :
    product.totalAmount)}</td>
                  ` : ''}
                </tr>
              `).join('') || ''}
              
              <tr>
                <td colspan="${hasGST ? '6' : '6'}" style="text-align: right;"><strong>Sub Total</strong></td>
                <td>${formatCurrency(inwardData.amount || 0)}</td>
                ${hasGST ? `
                <td></td>
                <td>${formatCurrency(inwardData.productDetails?.reduce((sum, product) =>
      sum + (parseInt(product.gstAmount) || 0), 0))}</td>
                <td>${formatCurrency(inwardData.productDetails?.reduce((sum, product) =>
        sum + (parseInt(product.totalAmount) || 0), 0))}</td>
                ` : ''}
              </tr>
              
              ${hasGST ? `
              <tr>
                <td colspan="10">
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 20px;">
                    <div>
                      <strong>GST Summary:</strong>
                      <table style="width: 100%; margin-top: 10px;">
                        <tr>
                          <th>Rate</th>
                          <th>Taxable Value</th>
                          <th>CGST</th>
                          <th>SGST</th>
                          <th>Total Tax</th>
                        </tr>
                        ${Array.from(new Set(inwardData.productDetails.map(p => p.gstPercentage)))
        .map(rate => {
          const products = inwardData.productDetails.filter(p => p.gstPercentage === rate);
          const taxableValue = products.reduce((sum, p) => sum + (p.productRate * p.quantity), 0);
          const totalGST = products.reduce((sum, p) => sum + (parseInt(p.gstAmount) || 0), 0);
          return `
                              <tr>
                                <td>${rate}%</td>
                                <td>${formatCurrency(taxableValue)}</td>
                                <td>${formatCurrency(totalGST / 2)}</td>
                                <td>${formatCurrency(totalGST / 2)}</td>
                                <td>${formatCurrency(totalGST)}</td>
                              </tr>
                            `;
        }).join('')}
                      </table>
                    </div>
                  </div>
                </td>
              </tr>
              ` : ''}
            </tbody>
          </table>
          
          <div class="amount-words">
            <strong>Amount Chargeable (in words)</strong><br>
            ${amountInWords} Rupees Only
          </div>
          
          ${hasGST ? `
          <div style="margin: 20px 0;">
            <strong>Tax Amount (in words):</strong><br>
            ${convertToWords(Math.floor(inwardData.productDetails?.reduce((sum, product) =>
          sum + (parseInt(product.gstAmount) || 0), 0)))} Rupees Only
          </div>
          ` : ''}
          
          <div class="declaration">
            <strong>Declaration</strong><br>
            We declare that this invoice shows the actual price of the goods described and that all particulars are true
            and correct.<br><br>
            ${hasGST ? `
            <strong>GST Note:</strong> CGST & SGST @ ${inwardData.productDetails[0]?.gstPercentage / 2}% each
            ` : 'This is a non-GST invoice'}
          </div>
          
          <div class="signatures">
            <div class="signature-box">
              <div class="signature-line">Customer's Seal and Signature</div>
              <div>Received the material in good condition</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">for ${inwardData.destination || 'Company Name'}</div>
              <div>Authorised Signatory</div>
            </div>
          </div>
          
          <div class="footer">
            This is a Computer Generated Invoice
          </div>
        </div>
      </body>
    </html>
  `;
};

const DetailSection = ({ title, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Icon name={getSectionIcon(title)} size={24} color="#0CC0DF" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const InfoRow = ({ label, value, icon }) => (
  <View style={styles.infoRow}>
    <View style={styles.labelContainer}>
      {icon && <Icon name={icon} size={16} color="#666" style={styles.infoIcon} />}
      <Text style={styles.label}>{label}</Text>
    </View>
    <Text style={styles.value}>{value || "Not available"}</Text>
  </View>
);

const InwardDetail = ({ route }) => {
  const { inwardId } = route.params;
  const navigation = useNavigation();
  const [inwardData, setInwardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const fetchInwardData = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/api/inward/getSingleInward/${inwardId}`);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      setInwardData(data);
    } catch (err) {
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInwardData();
  }, [inwardId]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const html = generateInvoiceHTML(inwardData);
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });

      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0CC0DF" />
        <Text style={styles.loadingText}>Loading inward details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="error-outline" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchInwardData}
        >
          <Icon name="refresh" size={20} color="#fff" />
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!inwardData) return null;

  const hasAnyGST = inwardData.productDetails?.some(product => parseInt(product.gstPercentage) > 0);
  const totalBaseAmount = inwardData.amount || 0;
  const totalGSTAmount = inwardData.productDetails?.reduce((sum, product) => 
    sum + (parseInt(product.gstAmount) || 0), 0) || 0;
  const totalFinalAmount = inwardData.productDetails?.reduce((sum, product) => 
    sum + (parseInt(product.totalAmount) || 0), 0) || 0;

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.invoiceNo}>Invoice No: {inwardData.invoiceNo}</Text>
        </View>
        <Text style={styles.dateText}>
          {format(new Date(inwardData.date), "dd MMMM yyyy")}
        </Text>
      </View>

      {/* Basic Information */}
      <DetailSection title="Basic Information">
        <InfoRow label="Category" value={inwardData.category} icon="category" />
        <InfoRow label="Source" value={inwardData.source} icon="location-on" />
        <InfoRow label="Destination" value={inwardData.destination} icon="place" />
        <InfoRow label="Warehouse" value={inwardData.warehouse} icon="warehouse" />
        <InfoRow label="Created At" value={new Date(inwardData.createdAt).toLocaleString()} icon="access-time" />
        <InfoRow label="Updated At" value={new Date(inwardData.updatedAt).toLocaleString()} icon="update" />
        {inwardData.remarks && (
          <InfoRow label="Remarks" value={inwardData.remarks} icon="comment" />
        )}
      </DetailSection>

      {/* Financial Details */}
      <DetailSection title="Financial Details">
        <InfoRow 
          label="Base Amount" 
          value={`₹${totalBaseAmount.toLocaleString()}`} 
          icon="payments" 
        />
        {hasAnyGST && (
          <>
            <InfoRow 
              label="Total GST" 
              value={`₹${totalGSTAmount.toLocaleString()}`} 
              icon="account-balance" 
            />
            <InfoRow 
              label="Final Amount (Inc. GST)" 
              value={`₹${totalFinalAmount.toLocaleString()}`} 
              icon="payments" 
            />
          </>
        )}
      </DetailSection>

      {/* Supplier Details */}
      <DetailSection title="Supplier Details">
        <InfoRow label="Supplier ID" value={inwardData.supplierDetails?.supplierId} icon="badge" />
        <InfoRow label="Name" value={inwardData.supplierDetails?.supplierName} icon="person" />
        <InfoRow label="Contact" value={inwardData.supplierDetails?.supplierMobileNo} icon="phone" />
        <InfoRow label="Email" value={inwardData.supplierDetails?.supplierEmailId} icon="email" />
        <InfoRow label="GSTIN" value={inwardData.supplierDetails?.supplierGSTNo} icon="receipt-long" />
        <InfoRow 
          label="Address" 
          value={inwardData.supplierDetails?.supplierAddress} 
          icon="location-on" 
        />
      </DetailSection>

      {/* Product Details */}
      <DetailSection title="Product Details">
        {inwardData.productDetails?.map((product, index) => {
          const baseAmount = (product.quantity || 0) * (product.productRate || 0);
          const hasGST = parseInt(product.gstPercentage) > 0;
          
          return (
            <View key={product._id || index} style={styles.productCard}>
              <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
                <Icon name="inventory" size={20} color="#0CC0DF" />
                <Text style={styles.productHeader}> Product #{index + 1}</Text>
              </View>
              <InfoRow label="Product ID" value={product.productId} icon="qr-code" />
              <InfoRow label="Name" value={product.name} icon="inventory-2" />
              <InfoRow label="Product Code" value={product.productCode} icon="local-offer" />
              <InfoRow label="Quantity" value={product.quantity?.toString() || '0'} icon="shopping-cart" />
              <InfoRow label="Rate" value={`₹${product.productRate?.toLocaleString() || '0'}`} icon="attach-money" />
              <InfoRow 
                label="GST Percentage" 
                value={hasGST ? `${product.gstPercentage}%` : "No GST"} 
                icon="percent" 
              />
              {hasGST && (
                <InfoRow 
                  label="GST Amount" 
                  value={`₹${product.gstAmount?.toLocaleString() || '0'}`} 
                  icon="account-balance" 
                />
              )}
              <InfoRow 
                label="Total Amount" 
                value={`₹${hasGST ? 
                  (product.totalAmount?.toLocaleString() || '0') : 
                  baseAmount.toLocaleString()}`} 
                icon="payments" 
              />
              {product.bagQuantity && (
                <InfoRow label="Bag Quantity" value={product.bagQuantity.toString()} icon="inventory" />
              )}
            </View>
          );
        })}
      </DetailSection>

      {/* Transport Details */}
      <DetailSection title="Transport Details">
        <InfoRow 
          label="Vehicle Type" 
          value={inwardData.transportDetails?.vehicleType} 
          icon="local-shipping" 
        />
        <InfoRow 
          label="Vehicle Number" 
          value={inwardData.transportDetails?.vehicleNumber} 
          icon="directions-car" 
        />
        <InfoRow 
          label="Driver Contact" 
          value={inwardData.transportDetails?.driverMobileNumber} 
          icon="phone" 
        />
        {inwardData.transportDetails?.vehicleTemperature && (
          <InfoRow 
            label="Vehicle Temperature" 
            value={`${inwardData.transportDetails.vehicleTemperature}°C`} 
            icon="thermostat" 
          />
        )}
      </DetailSection>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() => navigation.navigate("updateInward", { inwardId })}
        >
          <Icon name="edit" size={20} color="#fff" />
          <Text style={styles.buttonText}>Edit Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.downloadButton]}
          onPress={handleDownload}
          disabled={downloading}
        >
          <Icon name="download" size={20} color="#000" />
          <Text style={[styles.buttonText, { color: '#000' }]}>
            {downloading ? "Generating PDF..." : "Download Invoice"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const getSectionIcon = (title) => {
  switch (title) {
    case "Basic Information":
      return "info";
    case "Financial Details":
      return "payments";
    case "Supplier Details":
      return "person";
    case "Product Details":
      return "inventory";
    case "Transport Details":
      return "local-shipping";
    default:
      return "description";
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  invoiceNo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  dateText: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
  value: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  productCard: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionButtons: {
    padding: 16,
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  editButton: {
    backgroundColor: "#0CC0DF",
  },
  downloadButton: {
    backgroundColor: "#FFB700",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0CC0DF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  }
});

export default InwardDetail;