import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { format } from "date-fns";
import getEnvVars from "../../../config/environment";
import { useNavigation } from "@react-navigation/native";
import DownloadInvoiceButton from "./DownloadInvoiceButton";

const { API_URL } = getEnvVars();

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

const OutwardDetail = ({ route }) => {
  const navigation = useNavigation();
  const { outwardId } = route.params;
  const [outwardData, setOutwardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOutwardData = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/api/outward/getSingleOutward/${outwardId}`);
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      const data = await response.json();
      setOutwardData(data);
    } catch (err) {
      setError("Failed to load outward details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutwardData();
  }, [outwardId]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0CC0DF" />
        <Text style={styles.loadingText}>Loading outward details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="error-outline" size={48} color="#ff4d4d" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchOutwardData}>
          <Icon name="refresh" size={20} color="#fff" />
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!outwardData) return null;

  const getDeliveryStatusColor = (status) => {
    switch (status) {
      case "Delivered":
        return "#4CAF50";
      case "Shipped":
        return "#2196F3";
      default:
        return "#FFC107";
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.invoiceNo}>Invoice No: {outwardData.invoiceNo}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getDeliveryStatusColor(outwardData.transportDetails?.deliveryStatus) + "20" }
          ]}>
            <Text style={[
              styles.statusText,
              { color: getDeliveryStatusColor(outwardData.transportDetails?.deliveryStatus) }
            ]}>
              {outwardData.transportDetails?.deliveryStatus}
            </Text>
          </View>
        </View>
        <Text style={styles.dateText}>
          {format(new Date(outwardData.transportDetails?.transportDate), "dd MMMM yyyy")}
        </Text>
      </View>

      {/* Basic Information */}
      <DetailSection title="Basic Information">
        <InfoRow label="Category" value={outwardData.category} icon="category" />
        <InfoRow label="Source" value={outwardData.source} icon="location-on" />
        <InfoRow label="Destination" value={outwardData.destination} icon="place" />
        <InfoRow label="Created At" value={new Date(outwardData.createdAt).toLocaleString()} icon="access-time" />
        <InfoRow label="Updated At" value={new Date(outwardData.updatedAt).toLocaleString()} icon="update" />
      </DetailSection>

      {/* Financial Details */}
      <DetailSection title="Financial Details">
        {(() => {
          const totalBaseAmount = outwardData.productDetails?.reduce((sum, product) => 
            sum + ((product.quantity || 0) * (product.productPrice || 0)), 0);
          const totalGSTAmount = outwardData.productDetails?.reduce((sum, product) => 
            sum + (product.gstAmount || 0), 0);
          const hasAnyGST = outwardData.productDetails?.some(product => product.gstPercentage > 0);

          return (
            <>
              <InfoRow 
                label="Base Amount" 
                value={`₹${totalBaseAmount?.toLocaleString() || '0'}`} 
                icon="payments" 
              />
              {hasAnyGST && (
                <>
                  <InfoRow 
                    label="Total GST" 
                    value={`₹${totalGSTAmount?.toLocaleString() || '0'}`} 
                    icon="account-balance" 
                  />
                  <InfoRow 
                    label="Final Amount (Inc. GST)" 
                    value={`₹${outwardData.total?.toLocaleString() || '0'}`} 
                    icon="payments" 
                  />
                </>
              )}
              <InfoRow 
                label="Payment Type" 
                value={outwardData.paymentType} 
                icon="payment" 
              />
              <InfoRow 
                label="Outstanding Payment" 
                value={`₹${outwardData.outstandingPayment?.toLocaleString() || '0'}`} 
                icon="account-balance" 
              />
              <InfoRow 
                label="Invoice Status" 
                value={outwardData.invoiceGenerated ? "Generated" : "Pending"} 
                icon="receipt" 
              />
            </>
          );
        })()}
      </DetailSection>

      {/* Customer Details */}
      <DetailSection title="Customer Details">
        <InfoRow label="Customer ID" value={outwardData.customerDetails?.customerId} icon="badge" />
        <InfoRow label="Name" value={outwardData.customerDetails?.name} icon="person" />
        <InfoRow label="Contact" value={outwardData.customerDetails?.contactNumber} icon="phone" />
        <InfoRow label="GSTIN" value={outwardData.customerDetails?.address} icon="receipt-long" />
        <InfoRow label="Email" value={outwardData.customerDetails?.customerEmailId} icon="email" />
        <InfoRow 
          label="Address" 
          value={outwardData.customerDetails?.customerAddress} 
          icon="location-on" 
        />
      </DetailSection>

      {/* Product Details */}
      <DetailSection title="Product Details">
        {outwardData.productDetails?.map((product, index) => {
          const baseAmount = (product.quantity || 0) * (product.productPrice || 0);
          const hasGST = product.gstPercentage > 0;
          
          return (
            <View key={product._id || index} style={styles.productCard}>
              <Text style={styles.productHeader}>
                <Icon name="inventory" size={20} color="#0CC0DF" /> Product #{index + 1}
              </Text>
              <InfoRow label="Product ID" value={product.productId} icon="qr-code" />
              <InfoRow label="Name" value={product.name} icon="inventory-2" />
              <InfoRow label="Product Code" value={product.productCode} icon="local-offer" />
              <InfoRow label="Quantity" value={product.quantity?.toString() || '0'} icon="shopping-cart" />
              <InfoRow label="Price per unit" value={`₹${product.productPrice || '0'}`} icon="attach-money" />
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
            </View>
          );
        })}
      </DetailSection>

      {/* Transport Details */}
      <DetailSection title="Transport Details">
        <InfoRow 
          label="Vehicle Type" 
          value={outwardData.transportDetails?.vehicleType} 
          icon="local-shipping" 
        />
        <InfoRow 
          label="Vehicle Number" 
          value={outwardData.transportDetails?.vehicleNumber} 
          icon="directions-car" 
        />
        <InfoRow 
          label="Driver Name" 
          value={outwardData.transportDetails?.driverName} 
          icon="person" 
        />
        <InfoRow 
          label="Driver Contact" 
          value={outwardData.transportDetails?.driverContactNumber} 
          icon="phone" 
        />
        <InfoRow 
          label="Transport Date" 
          value={new Date(outwardData.transportDetails?.transportDate).toLocaleDateString()} 
          icon="event" 
        />
        <InfoRow 
          label="Rental Cost" 
          value={`₹${outwardData.transportDetails?.rentalCost?.toLocaleString() || '0'}`} 
          icon="attach-money" 
        />
        <InfoRow 
          label="Delivery Status" 
          value={outwardData.transportDetails?.deliveryStatus} 
          icon="local-shipping" 
        />
      </DetailSection>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() => navigation.navigate("OutwardUpdate", { outwardId })}
        >
          <Icon name="edit" size={20} color="#fff" />
          <Text style={styles.buttonText}>Edit Details</Text>
        </TouchableOpacity>

        <DownloadInvoiceButton outwardData={outwardData} />
      </View>
    </ScrollView>
  );
};

const getSectionIcon = (title) => {
  switch (title) {
    case "Transaction Details":
      return "receipt";
    case "Customer Details":
      return "person";
    case "Product Details":
      return "inventory";
    case "Transport Details":
      return "local-shipping";
    default:
      return "info";
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
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
  routeContainer: {
    marginTop: 16,
    paddingHorizontal: 8,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: "#ddd",
    marginLeft: 5,
  },
  routeText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#333",
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
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productMetrics: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  metric: {
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
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
  reviewButton: {
    backgroundColor: "#96E5D6",
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
  },
});

const additionalStyles = StyleSheet.create({
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
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default OutwardDetail;