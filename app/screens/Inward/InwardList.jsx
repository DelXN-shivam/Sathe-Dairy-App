import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TextInput,
  ScrollView,
  Platform,
  Alert,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { format } from "date-fns";
import Icon from "react-native-vector-icons/MaterialIcons";
import getEnvVars from "../../../config/environment";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

const { API_URL } = getEnvVars();
const { width } = Dimensions.get("window");

const TABLE_COLUMNS = [
  { id: "date", label: "Date", width: 120 },
  { id: "invoiceNo", label: "Invoice No.", width: 120 },
  { id: "category", label: "Category", width: 120 },
  { id: "supplier", label: "Supplier", width: 150 },
  { id: "route", label: "Route", width: 160 },
  { id: "products", label: "Products", width: 100 },
  { id: "amount", label: "Amount (₹)", width: 140 },
  { id: "actions", label: "Actions", width: 140 },
];

const getTableTotalWidth = () => {
  return TABLE_COLUMNS.reduce((total, column) => total + column.width, 0);
};

const TableHeader = () => {
  return (
    <View style={styles.tableHeader}>
      {TABLE_COLUMNS.map((column) => (
        <View key={column.id} style={[styles.headerCell, { width: column.width }]}>
          <Text style={styles.headerText}>{column.label}</Text>
        </View>
      ))}
    </View>
  );
};

// Add InwardTableRow component definition
const InwardTableRow = ({ item, onPress, onDownloadInvoice }) => {
  const totalQuantity = item.productDetails.reduce((sum, product) => sum + product.quantity, 0);
  const totalBags = item.productDetails.reduce((sum, product) => sum + product.bagQuantity, 0);

  return (
    <View style={styles.tableRow}>
      <TouchableOpacity 
        style={[styles.tableCell, { width: TABLE_COLUMNS[0].width }]}
        onPress={onPress}
      >
        <Text style={styles.invoiceTextLink}>#{item.invoiceNo}</Text>
      </TouchableOpacity>
      
      <View style={[styles.tableCell, { width: TABLE_COLUMNS[1].width }]}>
        <Text style={styles.dateText}>
          {format(new Date(item.date), "dd/MM/yyyy")}
        </Text>
      </View>
      
      <View style={[styles.tableCell, { width: TABLE_COLUMNS[2].width }]}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>
      
      <View style={[styles.tableCell, { width: TABLE_COLUMNS[3].width }]}>
        <View style={styles.iconTextContainer}>
          <Icon name="person" size={16} color="#666" />
          <Text style={styles.cellText}>{item.supplierDetails.supplierName}</Text>
        </View>
      </View>
      
      <View style={[styles.tableCell, { width: TABLE_COLUMNS[4].width }]}>
        <View style={styles.iconTextContainer}>
          <Icon name="route" size={16} color="#666" />
          <Text style={styles.cellText}>{item.source} → {item.destination}</Text>
        </View>
      </View>
      
      <View style={[styles.tableCell, { width: TABLE_COLUMNS[5].width }]}>
        <Text style={styles.centerText}>{item.productDetails.length} items</Text>
      </View>
      
      <View style={[styles.tableCell, { width: TABLE_COLUMNS[6].width }]}>
        <Text style={styles.amountText}>₹{item.amount.toLocaleString()}</Text>
      </View>
      
      <View style={[styles.tableCell, { width: TABLE_COLUMNS[7].width }]}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={onPress}
          >
            <Icon name="visibility" size={16} color="#fff" />
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
          
          {/* <TouchableOpacity
            style={[styles.viewButton, { backgroundColor: '#28a745' }]}
            onPress={() => onDownloadInvoice(item._id)}
          >
            <Icon name="download" size={16} color="#fff" />
          </TouchableOpacity> */}
        </View>
      </View>
    </View>
  );
};

const InwardList = () => {
  const [inwardData, setInwardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
  const navigation = useNavigation();
  const textInputRef = useRef(null);
  const scrollViewRef = useRef(null);

  const handleSearchChange = (text) => {
    setSearchQuery(text);
  };

  const filteredInwardData = useMemo(() => {
    if (!searchQuery.trim()) return inwardData;
    
    const searchLower = searchQuery.toLowerCase();
  
    return inwardData.filter(item => {
      // Ensure item exists
      if (!item) return false;
  
      // Safe check for transaction details
      const transactionMatch = 
        (item.invoiceNo?.toLowerCase() || "").includes(searchLower) ||
        (item.source?.toLowerCase() || "").includes(searchLower) ||
        (item.destination?.toLowerCase() || "").includes(searchLower) ||
        (item.category?.toLowerCase() || "").includes(searchLower) ||
        (item.date ? format(new Date(item.date), "dd/MM/yyyy").toLowerCase().includes(searchLower) : false);
      
      // Safe check for supplier details
      const supplierMatch = 
        (item.supplierDetails?.name?.toLowerCase() || "").includes(searchLower) ||
        (item.supplierDetails?.contactNumber || "").includes(searchLower);
      
      // Safe check for transport details
      const transportMatch = 
        (item.transportDetails?.vehicleNumber?.toLowerCase() || "").includes(searchLower) ||
        (item.transportDetails?.vehicleType?.toLowerCase() || "").includes(searchLower);
      
      return transactionMatch || supplierMatch || transportMatch;
    });
  }, [inwardData, searchQuery]);
  
  const toggleRowExpansion = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const convertToCSV = (data) => {
    const headers = [
      'Invoice No.',
      'Date',
      'Category',
      'Source',
      'Destination',
      'Supplier',
      'Vehicle Number',
      'Products Count',
      'Total Quantity',
      'Total Bags',
      'Amount (₹)'
    ];

    const csvRows = [
      headers.join(','),
      ...data.map(item => {
        const totalQuantity = item.productDetails.reduce((sum, product) => sum + product.quantity, 0);
        const totalBags = item.productDetails.reduce((sum, product) => sum + (product.bagQuantity || 0), 0);
        
        return [
          item.invoiceNo,
          item.date ? format(new Date(item.date), "dd/MM/yyyy") : "Invalid Date",
          item.category,
          item.source,
          item.destination,
          item.supplierDetails.supplierName,
          item.transportDetails.vehicleNumber,
          item.productDetails.length,
          totalQuantity,
          totalBags,
          item.amount
        ].join(',');
      })
    ];

    return csvRows.join('\n');
  };

  const handleExport = async () => {
    try {
      // Data to export (use filtered data if there's a search query)
      const dataToExport = filteredInwardData.length > 0 ? filteredInwardData : inwardData;
      const csvContent = convertToCSV(dataToExport);
      const fileName = `inward_data_${format(new Date(), 'dd-MM-yyyy')}.csv`;
      
      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', fileName);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, csvContent, {
          encoding: FileSystem.EncodingType.UTF8
        });
        
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Inward Data'
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export data. Please try again.');
    }
  };

  const fetchInwardData = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/api/inward/getAllInward`);

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      setInwardData(data);
    } catch (err) {
      setError("Failed to load data. Please try again.");
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSingleInward = async (inwardId) => {
    try {
      const response = await fetch(`${API_URL}/api/inward/getSingleInward/${inwardId}`);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      throw new Error("Failed to load invoice data.");
    }
  };

  const generateInvoiceHTML = (inwardData) => {
    return `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .invoice-details { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f9fa; }
            .total { text-align: right; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Inward Invoice</h1>
            <p>Invoice No: ${inwardData.invoiceNo}</p>
            <p>Date: ${new Date(inwardData.date).toLocaleDateString()}</p>
          </div>
          
          <div class="invoice-details">
            <h3>Supplier Details</h3>
            <p>Name: ${inwardData.supplierDetails?.name}</p>
            <p>Contact: ${inwardData.supplierDetails?.contactNumber}</p>
            <p>Address: ${inwardData.supplierDetails?.address}</p>
          </div>

          <h3>Product Details</h3>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Code</th>
                <th>Rate</th>
                <th>Quantity</th>
                <th>Bag Qty</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${inwardData.productDetails?.map(product => `
                <tr>
                  <td>${product.name}</td>
                  <td>${product.productCode}</td>
                  <td>₹${product.productRate?.toLocaleString()}</td>
                  <td>${product.quantity}</td>
                  <td>${product.bagQuantity || 0}</td>
                  <td>₹${(product.productRate * product.quantity).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total">
            <h3>Total Amount: ₹${inwardData.amount?.toLocaleString()}</h3>
          </div>
        </body>
      </html>
    `;
  };

  const handleDownloadInvoice = async (inwardId) => {
    try {
      setDownloadingInvoice(true);
      setDownloadingInvoiceId(inwardId);
      
      const inwardData = await fetchSingleInward(inwardId);
      const html = generateInvoiceHTML(inwardData);
      
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });
      
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Invoice_${inwardData.invoiceNo}`
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to download invoice. Please try again.');
    } finally {
      setDownloadingInvoice(false);
      setDownloadingInvoiceId(null);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchInwardData();
  };

  useEffect(() => {
    fetchInwardData();
  }, []);

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      {TABLE_COLUMNS.map((column) => (
        <View key={column.id} style={[styles.headerCell, { width: column.width }]}>
          <Text style={styles.headerText}>{column.label}</Text>
        </View>
      ))}
    </View>
  );

  const renderTableRow = (item) => {
    const totalProducts = item.productDetails.length;
    const totalQuantity = item.productDetails.reduce((sum, product) => sum + product.quantity, 0);
    const totalBags = item.productDetails.reduce((sum, product) => sum + (product.bagQuantity || 0), 0);
    
    return (
      <View key={item._id}>
        <TouchableOpacity 
          style={styles.tableRow}
          onPress={() => toggleRowExpansion(item._id)}
        >
          <View style={[styles.tableCell, { width: TABLE_COLUMNS[0].width }]}>
            <Text style={styles.dateText}>
              {format(new Date(item.date), "dd/MM/yyyy")}
            </Text>
          </View>
          
          <View style={[styles.tableCell, { width: TABLE_COLUMNS[1].width }]}>
            <Text style={styles.invoiceTextLink}>#{item.invoiceNo}</Text>
          </View>
          
          <View style={[styles.tableCell, { width: TABLE_COLUMNS[2].width }]}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>
          
          <View style={[styles.tableCell, { width: TABLE_COLUMNS[3].width }]}>
            <View style={styles.iconTextContainer}>
              <Icon name="person" size={16} color="#666" />
              <Text style={styles.cellText}>{item.supplierDetails.supplierName}</Text>
            </View>
          </View>
          
          <View style={[styles.tableCell, { width: TABLE_COLUMNS[4].width }]}>
            <View style={styles.iconTextContainer}>
              <Icon name="route" size={16} color="#666" />
              <Text style={styles.cellText}>{item.source} → {item.destination}</Text>
            </View>
          </View>
          
          <View style={[styles.tableCell, { width: TABLE_COLUMNS[5].width }]}>
            <Text style={styles.centerText}>{totalProducts} items</Text>
          </View>
          
          <View style={[styles.tableCell, { width: TABLE_COLUMNS[6].width }]}>
            <Text style={styles.amountText}>₹{item.amount.toLocaleString()}</Text>
          </View>
          
          <View style={[styles.tableCell, { width: TABLE_COLUMNS[7].width }]}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("InwardDetail", { inwardId: item._id })}
            >
              <Icon name="visibility" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        
        {expandedRow === item._id && (
          <View style={styles.expandedContent}>
            <View style={styles.expandedSection}>
              <Text style={styles.sectionTitle}>Supplier Details</Text>
              <View style={styles.infoRow}>
                <Icon name="person" size={16} color="#666" />
                <Text style={styles.infoText}>{item.supplierDetails.supplierName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="phone" size={16} color="#666" />
                <Text style={styles.infoText}>{item.supplierDetails.supplierMobileNo}</Text>
              </View>
            </View>

            <View style={styles.expandedSection}>
              <Text style={styles.sectionTitle}>Transport Details</Text>
              <View style={styles.infoRow}>
                <Icon name="local-shipping" size={16} color="#666" />
                <Text style={styles.infoText}>
                  {item.transportDetails.vehicleType} - {item.transportDetails.vehicleNumber}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="route" size={16} color="#666" />
                <Text style={styles.infoText}>
                  {item.source} → {item.destination}
                </Text>
              </View>
            </View>

            <View style={styles.expandedSection}>
              <Text style={styles.sectionTitle}>Products Summary</Text>
              <View style={styles.infoRow}>
                <Icon name="category" size={16} color="#666" />
                <Text style={styles.infoText}>
                  {totalProducts} products, {totalQuantity} qty, {totalBags} bags
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.detailsButton}
              onPress={() => navigation.navigate("InwardDetail", { inwardId: item._id })}
            >
              <Icon name="visibility" size={20} color="#fff" />
              <Text style={styles.buttonText}>View Full Details</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="inbox" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No inward records found</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery ? "Try adjusting your search" : "Add your first inward record"}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0CC0DF" />
        <Text style={styles.loadingText}>Loading inward records...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#ff4d4d" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchInwardData}>
            <Icon name="refresh" size={20} color="#fff" />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Header Section */}
          <View style={styles.headerContainer}>
            <View style={styles.headerTopRow}>
              <View style={styles.searchBar}>
                <Icon name="search" size={24} color="#666" />
                <TextInput
                  ref={textInputRef}
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  placeholder="Search by invoice, supplier, vehicle..."
                  style={styles.searchInput}
                  returnKeyType="search"
                  autoCorrect={false}
                />
                {searchQuery ? (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery("");
                      if (Platform.OS === 'ios') {
                        setTimeout(() => {
                          textInputRef.current?.focus();
                        }, 100);
                      }
                    }}
                  >
                    <Icon name="close" size={24} color="#666" />
                  </TouchableOpacity>
                ) : null}
              </View>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={handleExport}
                >
                  <Icon name="download" size={22} color="#fff" />
                  <Text style={styles.exportButtonText}>Export</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => navigation.navigate("AddInward")}
                >
                  <Icon name="add" size={22} color="#fff" />
                  <Text style={styles.addButtonText}>New Inward</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Table Content */}
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            <ScrollView 
              horizontal 
              ref={scrollViewRef}
              contentContainerStyle={styles.tableContainer}
              showsHorizontalScrollIndicator={true}
            >
              <View>
                {renderTableHeader()}
                {filteredInwardData.length > 0 
                  ? filteredInwardData.map(item => renderTableRow(item))
                  : renderEmptyList()
                }
              </View>
            </ScrollView>
          </ScrollView>

          {/* Loading overlay for invoice download */}
          {downloadingInvoice && (
            <View style={styles.downloadOverlay}>
              <View style={styles.downloadModal}>
                <ActivityIndicator size="large" color="#0CC0DF" />
                <Text style={styles.downloadingText}>Generating invoice...</Text>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.OS === 'web' ? 0 : width < 600 ? 12 : 0,
  },
  searchBar: {
    flex: 1,
    minWidth: 250,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: "#333",
  },
  exportButton: {
    backgroundColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    minWidth: 120,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: "#0CC0DF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    minWidth: 140,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  tableContainer: {
    paddingVertical: 8,
    minWidth: width,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginHorizontal: 8,
    marginTop: 8,
  },
  headerCell: {
    padding: 12,
    justifyContent: "center",
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginHorizontal: 8,
  },
  tableCell: {
    padding: 12,
    justifyContent: "center",
  },
  expandedContent: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    marginHorizontal: 8,
    marginBottom: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  expandedSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  iconTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  invoiceTextLink: {
    fontWeight: "700",
    fontSize: 14,
    color: "#0066CC",
    textDecorationLine: "underline",
  },
  dateText: {
    fontSize: 14,
    color: "#666",
  },
  categoryBadge: {
    backgroundColor: "#e6f7ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  categoryText: {
    color: "#0CC0DF",
    fontSize: 12,
    fontWeight: "600",
  },
  cellText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 5,
    flex: 1,
  },
  centerText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    textAlign: "center",
  },
  amountText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#0CC0DF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  detailsButton: {
    backgroundColor: "#0CC0DF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: "#0CC0DF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  downloadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadModal: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: 250,
  },
  downloadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

export default InwardList;