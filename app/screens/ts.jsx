import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import moment from 'moment';
import { AlertCircle, Download } from 'react-native-feather';
import getEnvVars from "../../config/environment";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../contexts/authContext';

const TransactionDetailsScreen = ({ route }) => {
  const { getAuthHeader } = useAuth();
  const { API_URL } = getEnvVars();
  const { transactionId, transactionType } = route.params;
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      if (!transactionId || !transactionType) {
        setError('Invalid transaction details');
        return;
      }

      setLoading(true);

      try {
        const endpoint = transactionType === 'inward' 
          ? `inward/updateInward/${transactionId}`
          : `outward/updateOutward/${transactionId}`;

        const response = await axios.patch(`${API_URL}/api/${endpoint}`, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
          },
        });

        setTransaction(response.data);
      } catch (err) {
        console.error('API Error Details:', err.response);
        setError(`Failed to load transaction details: ${err.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [transactionId, transactionType, API_URL]);

  const generateInvoiceHTML = () => {
    const productRows = transaction.productDetails.map((product, index) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 8px;">${product.name}</td>
        <td style="padding: 8px;">${product.productCode}</td>
        <td style="padding: 8px; text-align: right;">${product.quantity}</td>
        <td style="padding: 8px; text-align: right;">₹${product.productRate || product.productPrice}</td>
        <td style="padding: 8px; text-align: right;">₹${(product.quantity * (product.productRate || product.productPrice)).toFixed(2)}</td>
      </tr>
    `).join('');

    const totalAmount = transaction.productDetails.reduce((sum, product) => 
      sum + (product.quantity * (product.productRate || product.productPrice)), 0
    );

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica'; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .table th { background: #f8f9fa; text-align: left; padding: 8px; }
            .details-grid { display: grid; grid-template-columns: auto 1fr; gap: 8px; margin-bottom: 20px; }
            .label { font-weight: bold; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Invoice</h1>
            <p>Invoice No: ${transaction.invoiceNo}</p>
            <p>Date: ${moment(transaction.createdAt).format('MMM DD, YYYY')}</p>
          </div>

          <div class="section">
            <h2>${transactionType === 'inward' ? 'Supplier Details' : 'Customer Details'}</h2>
            <div class="details-grid">
              <div class="label">Name:</div>
              <div>${transactionType === 'inward' ? 
                transaction.supplierDetails?.name : 
                transaction.customerDetails?.name}</div>
              
              <div class="label">Contact:</div>
              <div>${transactionType === 'inward' ? 
                transaction.supplierDetails?.contactNumber : 
                transaction.customerDetails?.contactNumber}</div>
              
              <div class="label">Address:</div>
              <div>${transactionType === 'inward' ? 
                transaction.supplierDetails?.address : 
                transaction.customerDetails?.customerAddress}</div>
            </div>
          </div>

          <div class="section">
            <h2>Product Details</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Code</th>
                  <th style="text-align: right;">Quantity</th>
                  <th style="text-align: right;">Rate</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${productRows}
                <tr>
                  <td colspan="4" style="text-align: right; padding: 8px; font-weight: bold;">Total Amount:</td>
                  <td style="text-align: right; padding: 8px; font-weight: bold;">₹${totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Transport Details</h2>
            <div class="details-grid">
              <div class="label">Vehicle Type:</div>
              <div>${transaction.transportDetails?.vehicleType}</div>
              
              <div class="label">Vehicle Number:</div>
              <div>${transaction.transportDetails?.vehicleNumber}</div>
              
              <div class="label">Driver Name:</div>
              <div>${transaction.transportDetails?.driverName}</div>
              
              <div class="label">Transport Date:</div>
              <div>${moment(transaction.transportDetails?.transportDate).format('MMM DD, YYYY')}</div>
              
              <div class="label">Rental Cost:</div>
              <div>₹${transaction.transportDetails?.rentalCost}</div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const generateAndDownloadInvoice = async () => {
    setGenerating(true);
    try {
      // Generate PDF using expo-print
      const html = generateInvoiceHTML();
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });
      
      // Share the generated PDF
      await Sharing.shareAsync(uri);
      
      // Update transaction status on the server
      await axios.patch(`${API_URL}/api/${transactionType}/update-status/${transactionId}`, {
        invoiceGenerated: true,
        invoiceGeneratedAt: new Date().toISOString()
      });
      
      // Update local state
      setTransaction(prev => ({
        ...prev,
        invoiceGenerated: true,
        invoiceGeneratedAt: new Date().toISOString()
      }));
    } catch (err) {
      console.error('Invoice generation error:', err);
      setError('Failed to generate invoice. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ScrollView className="bg-gray-50 p-4">
      {/* Invoice Generation Button */}
      <TouchableOpacity
        onPress={generateAndDownloadInvoice}
        disabled={generating}
        className={`mb-4 flex-row items-center justify-center p-4 rounded-lg ${
          generating ? 'bg-gray-400' : 'bg-blue-500'
        }`}
      >
        {generating ? (
          <ActivityIndicator color="white" className="mr-2" />
        ) : (
          <Download width={24} height={24} className="text-white mr-2" />
        )}
        <Text className="text-white font-semibold">
          {generating ? 'Generating Invoice...' : 'Generate & Download Invoice ...'}
        </Text>
      </TouchableOpacity>

      {/* Invoice Status */}
      {transaction?.invoiceGenerated && (
        <DetailSection title="Invoice Status">
          <DetailRow label="Invoice Generated" value="Yes" />
          <DetailRow 
            label="Generated On" 
            value={moment(transaction.invoiceGeneratedAt).format('MMM DD, YYYY, hh:mm A')} 
          />
        </DetailSection>
      )}

      {/* Basic Information */}
      <DetailSection title="Transaction Information">
        <DetailRow label="Invoice No" value={transaction?.invoiceNo} />
        <DetailRow label="Date" value={moment(transaction?.createdAt).format('MMM DD, YYYY')} />
        <DetailRow label="Category" value={transaction?.category} />
        <DetailRow label="Source" value={transaction?.source} />
        <DetailRow label="Destination" value={transaction?.destination} />
      </DetailSection>

      {/* Entity Details (Customer/Supplier) */}
      <DetailSection title={transactionType === 'inward' ? 'Supplier Details' : 'Customer Details'}>
        <DetailRow 
          label="Name" 
          value={transactionType === 'inward' ? 
            transaction?.supplierDetails?.name : 
            transaction?.customerDetails?.name
          } 
        />
        <DetailRow 
          label="Contact" 
          value={transactionType === 'inward' ? 
            transaction?.supplierDetails?.contactNumber : 
            transaction?.customerDetails?.contactNumber
          } 
        />
        <DetailRow 
          label="Address" 
          value={transactionType === 'inward' ? 
            transaction?.supplierDetails?.address : 
            transaction?.customerDetails?.customerAddress
          } 
        />
        {transactionType === 'outward' && (
          <DetailRow 
            label="Email" 
            value={transaction?.customerDetails?.customerEmailId} 
          />
        )}
      </DetailSection>

      {/* Transport Details */}
      <DetailSection title="Transport Details">
        <DetailRow label="Vehicle Type" value={transaction?.transportDetails?.vehicleType} />
        <DetailRow label="Vehicle Number" value={transaction?.transportDetails?.vehicleNumber} />
        <DetailRow label="Driver Name" value={transaction?.transportDetails?.driverName} />
        <DetailRow label="Driver Contact" value={transaction?.transportDetails?.driverContactNumber} />
        <DetailRow label="Transport Date" 
          value={moment(transaction?.transportDetails?.transportDate).format('MMM DD, YYYY')} 
        />
        <DetailRow label="Rental Cost" value={`₹${transaction?.transportDetails?.rentalCost}`} />
        {transactionType === 'outward' && (
          <DetailRow label="Delivery Status" value={transaction?.transportDetails?.deliveryStatus} />
        )}
      </DetailSection>

      {/* Product Details */}
      <DetailSection title="Product Details">
        {transaction?.productDetails?.map((product, index) => (
          <View key={index} className="mb-3 pb-3 border-b border-gray-100">
            <DetailRow label="Product Name" value={product.name} />
            <DetailRow label="Product Code" value={product.productCode} />
            <DetailRow label="Quantity" value={product.quantity.toString()} />
            <DetailRow 
              label="Rate" 
              value={`₹${product.productRate || product.productPrice}`} 
            />
            {transactionType === 'inward' && product.bagQuantity && (
              <DetailRow label="Bag Quantity" value={product.bagQuantity.toString()} />
            )}
          </View>
        ))}
      </DetailSection>

      {/* Payment Details (primarily for outward transactions) */}
      {transactionType === 'outward' && (
        <DetailSection title="Payment Details">
          <DetailRow label="Total Amount" value={`₹${transaction?.total}`} />
          <DetailRow label="Payment Type" value={transaction?.paymentType} />
          <DetailRow 
            label="Outstanding Payment" 
            value={`₹${transaction?.outstandingPayment}`} 
          />
          <DetailRow 
            label="Payment Status" 
            value={transaction?.outstandingPayment > 0 ? 'Pending' : 'Paid'} 
          />
        </DetailSection>
      )}
    </ScrollView>
  );
};

export default TransactionDetailsScreen;










  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-4">
        <AlertCircle width={48} height={48} className="text-red-500 mb-4" />
        <Text className="text-red-500 text-lg text-center">{error}</Text>
      </View>
    );
  }

  const DetailSection = ({ title, children }) => (
    <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
      <Text className="text-lg font-semibold mb-3">{title}</Text>
      {children}
    </View>
  );

  const DetailRow = ({ label, value }) => (
    <View className="flex-row justify-between py-2 border-b border-gray-100">
      <Text className="text-gray-600">{label}</Text>
      <Text className="text-gray-800 font-medium">{value}</Text>
    </View>
  );