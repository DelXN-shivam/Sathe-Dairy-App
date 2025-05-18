import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TextInput,
  Platform,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { format } from "date-fns";
import Icon from "react-native-vector-icons/MaterialIcons";
import getEnvVars from "../../../config/environment";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const { API_URL } = getEnvVars();
const { width } = Dimensions.get('window');

const TABLE_COLUMNS = [
  { id: "date", label: "Date", width: 120 },
  { id: "invoiceNo", label: "Invoice No.", width: 120 },
  { id: "category", label: "Category", width: 120 },
  { id: "customer", label: "Customer", width: 150 },
  { id: "route", label: "Route", width: 160 },
  { id: "products", label: "Products", width: 100 },
  { id: "amount", label: "Amount (₹)", width: 140 },
  { id: "actions", label: "Actions", width: 140 },
];

const OutwardList = () => {
  const [outwardData, setOutwardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const textInputRef = useRef(null);
  const scrollViewRef = useRef(null);
  const navigation = useNavigation();

  const handleSearchChange = (text) => {
    setSearchQuery(text);
  };

  const filteredOutwardData = useMemo(() => {
    if (!searchQuery.trim()) return outwardData;
    
    const searchLower = searchQuery.toLowerCase();
    return outwardData.filter(item => {
      return (
        item.invoiceNo?.toLowerCase().includes(searchLower) ||
        item.customerDetails?.name.toLowerCase().includes(searchLower) ||
        item.transportDetails?.vehicleNumber?.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower) ||
        (item.transportDetails?.transportDate && 
          format(new Date(item.transportDetails.transportDate), "dd/MM/yyyy")
            .toLowerCase()
            .includes(searchLower))
      );
    });
  }, [outwardData, searchQuery]);

  const convertToCSV = (data) => {
    const headers = [
      'Date',
      'Invoice No',
      'Customer Name',
      'Contact Number',
      'Source',
      'Destination',
      'Category',
      'Quantity',
      'Total Amount',
      'Outstanding Payment',
      'Payment Type',
      'Vehicle Type',
      'Vehicle Number',
      'Delivery Status'
    ];

    const csvRows = [
      headers.join(','),
      ...data.map(item => [
        item.transportDetails?.transportDate ? format(new Date(item.transportDetails.transportDate), "dd/MM/yyyy") : '-',
        item.invoiceNo || '-',
        item.customerDetails?.name || '-',
        item.customerDetails?.contactNumber || '-',
        item.source || '-',
        item.destination || '-',
        item.category || '-',
        item.quantity || '-',
        item.total || '0',
        item.outstandingPayment || '0',
        item.paymentType || '-',
        item.transportDetails?.vehicleType || '-',
        item.transportDetails?.vehicleNumber || '-',
        item.transportDetails?.deliveryStatus || '-'
      ].join(','))
    ];

    return csvRows.join('\n');
  };

  const handleExport = async () => {
    try {
      const dataToExport = filteredOutwardData.length > 0 ? filteredOutwardData : outwardData;
      const csvContent = convertToCSV(dataToExport);
      const fileName = `outward_data_${format(new Date(), 'dd-MM-yyyy')}.csv`;
      
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
          dialogTitle: 'Export Data'
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export data. Please try again.');
    }
  };

  const fetchOutwardData = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/api/outward/getAllOutward`);
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      const data = await response.json();
      setOutwardData(data);
    } catch (err) {
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOutwardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOutwardData();
  };

  const toggleRowExpansion = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Delivered':
        return styles.statusDelivered;
      case 'Shipped':
        return styles.statusShipped;
      default:
        return styles.statusPending;
    }
  };

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
    const formattedDate = item.transportDetails?.transportDate
      ? format(new Date(item.transportDetails.transportDate), "dd/MM/yyyy")
      : "-";
      
    const productCount = item.productDetails?.length || 0;
      
    return (
      <View key={item._id}>
        <TouchableOpacity 
          style={styles.tableRow}
          onPress={() => toggleRowExpansion(item._id)}
        >
          <View style={[styles.tableCell, { width: TABLE_COLUMNS[0].width }]}>
            <Text style={styles.dateText}>{formattedDate}</Text>
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
              <Text style={styles.cellText}>{item.customerDetails.name}</Text>
            </View>
          </View>
          
          <View style={[styles.tableCell, { width: TABLE_COLUMNS[4].width }]}>
            <View style={styles.iconTextContainer}>
              <Icon name="route" size={16} color="#666" />
              <Text style={styles.cellText}>
                {item.source} → {item.destination}
              </Text>
            </View>
          </View>
          
          <View style={[styles.tableCell, { width: TABLE_COLUMNS[5].width }]}>
            <Text style={styles.centerText}>{productCount} items</Text>
          </View>
          
          <View style={[styles.tableCell, { width: TABLE_COLUMNS[6].width }]}>
            <Text style={styles.amountText}>₹{item.total}</Text>
            {item.outstandingPayment > 0 && (
              <Text style={styles.outstandingText}>₹{item.outstandingPayment} due</Text>
            )}
          </View>
          
          <View style={[styles.tableCell, { width: TABLE_COLUMNS[7].width }]}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate("OutwardDetail", { outwardId: item._id })}
            >
              <Icon name="visibility" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        
        {expandedRow === item._id && (
          <View style={styles.expandedContent}>
            <View style={styles.expandedSection}>
              <Text style={styles.sectionTitle}>Customer Details</Text>
              <View style={styles.infoRow}>
                <Icon name="person" size={16} color="#666" />
                <Text style={styles.infoText}>{item.customerDetails.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="phone" size={16} color="#666" />
                <Text style={styles.infoText}>{item.customerDetails.contactNumber}</Text>
              </View>
            </View>

            <View style={styles.expandedSection}>
              <Text style={styles.sectionTitle}>Transaction Details</Text>
              <View style={styles.infoRow}>
                <Icon name="category" size={16} color="#666" />
                <Text style={styles.infoText}>Category: {item.category}</Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="shopping-cart" size={16} color="#666" />
                <Text style={styles.infoText}>Total Quantity: {item.quantity || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="payment" size={16} color="#666" />
                <Text style={styles.infoText}>
                  ₹{item.total} ({item.paymentType})
                </Text>
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
                <Icon name="schedule" size={16} color="#666" />
                <Text style={styles.infoText}>
                  Status: {item.transportDetails.deliveryStatus}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.detailsButton}
              onPress={() => navigation.navigate("OutwardDetail", { outwardId: item._id })}
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
      <Icon name="local-shipping" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No outward records found</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery ? "Try adjusting your search" : "Add your first outward record"}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0CC0DF" />
        <Text style={styles.loadingText}>Loading outward records...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#ff4d4d" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOutwardData}>
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
                  placeholder="Search by invoice, customer, vehicle..."
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
                  onPress={() => navigation.navigate("AddOutward")}
                >
                  <Icon name="add" size={22} color="#fff" />
                  <Text style={styles.addButtonText}>New Outward</Text>
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
                {filteredOutwardData.length > 0 
                  ? filteredOutwardData.map(item => renderTableRow(item))
                  : renderEmptyList()
                }
              </View>
            </ScrollView>
          </ScrollView>
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
  outstandingText: {
    fontSize: 12,
    color: "#ff4d4d",
    marginTop: 4,
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 100,
  },
  statusDelivered: {
    backgroundColor: "#e6fff0",
  },
  statusShipped: {
    backgroundColor: "#e6f7ff",
  },
  statusPending: {
    backgroundColor: "#fff7e6",
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default OutwardList;