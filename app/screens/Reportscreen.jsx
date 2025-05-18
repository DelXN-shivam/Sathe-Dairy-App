import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Modal,
  Alert,
  useWindowDimensions
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/authContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Card, Searchbar, DataTable, List } from 'react-native-paper';
import * as Print from 'expo-print';
import * as XLSX from 'xlsx';
import { Buffer } from 'buffer';

import getEnvVars from "../../config/environment";

const LedgerTransactions = ({ data, type }) => {
  if (!data?.transactions || data.transactions.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No transactions found</Text>
      </View>
    );
  }

  let balance = 0;
  const transactions = data.transactions.map(transaction => {
    const amount = type === 'customer' ? transaction.total : transaction.amount;
    balance += amount;
    return {
      ...transaction,
      balance
    };
  });

  return (
    <View style={styles.ledgerContainer}>
      <Text style={styles.ledgerTitle}>Ledger Details</Text>
      <DataTable style={styles.ledgerTable}>
        <DataTable.Header style={styles.tableHeader}>
          <DataTable.Title style={styles.tableColumnDate}>Date</DataTable.Title>
          <DataTable.Title style={styles.tableColumnInvoice}>Invoice No.</DataTable.Title>
          <DataTable.Title style={styles.tableColumnAmount} numeric>Amount</DataTable.Title>
          <DataTable.Title style={styles.tableColumnBalance} numeric>Balance</DataTable.Title>
        </DataTable.Header>

        {transactions.map((transaction, index) => (
          <DataTable.Row key={index} style={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
            <DataTable.Cell style={styles.tableColumnDate}>
              {new Date(transaction.createdAt || transaction.date).toLocaleDateString()}
            </DataTable.Cell>
            <DataTable.Cell style={styles.tableColumnInvoice}>
              {type === 'customer' 
                ? `#${transaction.invoiceNo || 'N/A'}` 
                : `PO #${transaction.purchaseOrderNumber || transaction.invoiceNo || 'N/A'}`}
            </DataTable.Cell>
            <DataTable.Cell style={styles.tableColumnAmount} numeric>
              <Text style={styles.amountText}>
                ₹{(type === 'customer' ? transaction.total : transaction.amount)
                  .toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell style={styles.tableColumnBalance} numeric>
              <Text style={styles.balanceText}>
                ₹{transaction.balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </Text>
            </DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>
    </View>
  );
};

const ReportScreen = () => {

   const { getAuthHeader, userRole } = useAuth();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [showSupplierList, setShowSupplierList] = useState(false);
  const [partiesLoading, setPartiesLoading] = useState(false);
  const [partiesError, setPartiesError] = useState(null);
  const [partySearchQuery, setPartySearchQuery] = useState('');

  const { API_URL } = getEnvVars();

  const [data, setData] = useState({
    financial: null,
    gst: null,
  });

  const [ledgerData, setLedgerData] = useState(null);
  const [selectedPartyId, setSelectedPartyId] = useState(null);
  const [selectedPartyType, setSelectedPartyType] = useState(null);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch customers and suppliers
  const fetchParties = async () => {
    setPartiesLoading(true);
    setPartiesError(null);
    
    try {
      console.log('API URL:', API_URL);
      
      const customersResponse = await fetch(`${API_URL}/api/customer/getAllCustomer`);
      const suppliersResponse = await fetch(`${API_URL}/api/Suppliers/getAllSupplier`);

      if (!customersResponse.ok) {
        throw new Error(`Customer API error: ${customersResponse.status}`);
      }
      if (!suppliersResponse.ok) {
        throw new Error(`Supplier API error: ${suppliersResponse.status}`);
      }

      const customersData = await customersResponse.json();
      const suppliersData = await suppliersResponse.json();

      console.log('Customers fetched:', customersData);
      console.log('Suppliers fetched:', suppliersData);

      setCustomers(customersData);
      setSuppliers(suppliersData);

    } catch (error) {
      console.error('Error fetching parties:', error);
      setPartiesError(error.message);
      Alert.alert(
        'Error',
        'Failed to fetch data. Please try again.',
        [
          { text: 'Retry', onPress: () => fetchParties() },
          { text: 'OK' }
        ]
      );
    } finally {
      setPartiesLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, []);


  // Modified useEffect with retry mechanism
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const attemptFetch = async () => {
      try {
        await fetchParties();
      } catch (error) {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying fetch (${retryCount}/${maxRetries})...`);
          setTimeout(attemptFetch, 2000 * retryCount); // Exponential backoff
        }
      }
    };

    attemptFetch();
  }, []);


  // Party List Modal
  const PartyListModal = ({ visible, onClose, parties, type, onSelect }) => {
    const getPartyName = (party) => {
      return type === 'supplier' ? party.supplierName : party.customerName;
    };
  
    const getPartyGst = (party) => {
      return type === 'supplier' ? party.supplierGSTNo : party.customerGSTNo;
    };
  
    const filteredParties = parties?.filter(party => 
      getPartyName(party)?.toLowerCase().includes(partySearchQuery.toLowerCase()) ||
      getPartyGst(party)?.toLowerCase().includes(partySearchQuery.toLowerCase())
    ) || [];
  
    return (
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select {type === 'customer' ? 'Customer' : 'Supplier'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
  
          <Searchbar
            placeholder={`Search by name or GST...`}
            onChangeText={setPartySearchQuery}
            value={partySearchQuery}
            style={styles.searchBar}
            iconColor="#3E7BFA"
          />
  
          {partiesLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#3E7BFA" style={styles.loader} />
              <Text style={styles.loaderText}>Loading {type}s...</Text>
            </View>
          ) : filteredParties.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No {type}s found</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => fetchParties()}
                activeOpacity={0.7}
              >
                <Text style={styles.retryButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.partyListContainer}>
              {filteredParties.map((party) => (
                <TouchableOpacity
                  key={party._id}
                  style={styles.partyItem}
                  onPress={() => {
                    onSelect(party._id);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.partyName}>{getPartyName(party)}</Text>
                  <Text style={styles.partyGst}>{getPartyGst(party) || 'No GST'}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    );
  };

  // Modified fetchLedgerData to handle different ID types and ensure party details
  const fetchLedgerData = async (partyType, partyId) => {
    try {
      setLoading(true);
      
      // Check if partyId is null or undefined
      if (!partyId) {
        Alert.alert('Error', 'No party selected. Please select a customer or supplier first.');
        setLoading(false);
        return;
      }
      
      // Check if the ID is a GST number (not a MongoDB ObjectId)
      const isGSTNumber = typeof partyId === 'string' && 
                         (partyId.startsWith('GST') || 
                          partyId.length !== 24 || 
                          !/^[0-9a-fA-F]{24}$/.test(partyId));
                          
      // Get party details
      let partyDetails = null;
      
      // Find the party by ID or GST number
      if (isGSTNumber) {
        // If it's a GST number, find the party with matching GST
        const parties = partyType === 'supplier' ? suppliers : customers;
        const gstField = partyType === 'supplier' ? 'supplierGSTNo' : 'customerGSTNo';
        
        partyDetails = parties.find(p => p[gstField] === partyId);
        
        // If no direct match, try case-insensitive comparison
        if (!partyDetails) {
          partyDetails = parties.find(p => 
            p[gstField] && p[gstField].toLowerCase() === partyId.toLowerCase()
          );
        }
      } else {
        // Regular ID-based lookup
        if (partyType === 'supplier') {
          partyDetails = suppliers.find(s => s._id === partyId);
        } else {
          partyDetails = customers.find(c => c._id === partyId);
        }
      }
                      
      const dateParams = startDate && endDate 
        ? `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        : '';

      // Use different endpoints based on the ID type
      let endpoint;
      if (isGSTNumber) {
        // Use GST-based endpoint
        endpoint = `${API_URL}/api/analytics/ledgers-by-gst/${partyType}/${encodeURIComponent(partyId)}${dateParams}`;
      } else {
        // Use regular ObjectId-based endpoint
        endpoint = `${API_URL}/api/analytics/ledgers/${partyType}/${partyId}${dateParams}`;
      }

      console.log('Fetching ledger data from:', endpoint);

      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        Alert.alert('No Data', 'No ledger transactions found for the selected party in this date range.');
      }
      
      // Add type property to partyDetails for PDF/Excel export logic
      if (partyDetails) {
        partyDetails.type = partyType;
      }
      
      setLedgerData({
        transactions: data,
        party: partyDetails
      });
      setShowLedgerModal(true);
    } catch (error) {
      console.error('Error fetching ledger data:', error);
      Alert.alert(
        'Error', 
        'Failed to fetch ledger data. ' + (error.message || 'Please try again later.')
      );
    } finally {
      setLoading(false);
    }
  };

  // Add party selection buttons to the header
  const PartySelectionButtons = () => (
    <View style={styles.partyButtonsContainer}>
      {partiesLoading ? (
        <ActivityIndicator size="small" color="#0000ff" />
      ) : partiesError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{partiesError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchParties()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={styles.partyButton}
            onPress={() => setShowCustomerList(true)}
          >
            <Text style={styles.partyButtonText}>
              Select Customer ({customers?.length || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.partyButton}
            onPress={() => setShowSupplierList(true)}
          >
            <Text style={styles.partyButtonText}>
              Select Supplier ({suppliers?.length || 0})
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );



  // Fetch data from all endpoints
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const dateParams = startDate && endDate 
        ? `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        : '';

      console.log('Fetching data with params:', dateParams);

      const [financialResponse, gstResponse] = await Promise.all([
        fetch(`${API_URL}/api/analytics/financial-summary${dateParams}`),
        fetch(`${API_URL}/api/analytics/gst-summary${dateParams}`),
      ]);

      if (!financialResponse.ok || !gstResponse.ok) {
        throw new Error('One or more API requests failed');
      }

      const [financial, gst] = await Promise.all([
        financialResponse.json(),
        gstResponse.json(),
      ]);

      setData({ financial, gst });

      // Fetch ledger data if party is selected
      if (selectedPartyId && selectedPartyType) {
        await fetchLedgerData(selectedPartyType, selectedPartyId);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
      Alert.alert('Error', 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  useEffect(() => {
    if (selectedPartyId && selectedPartyType) {
      const dateParams = startDate && endDate 
        ? `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        : '';
      fetchLedgerData(selectedPartyType, selectedPartyId);
    }
  }, [selectedPartyId, selectedPartyType]);

  // Date picker handlers
  const onStartDateChange = (event, selectedDate) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  // Enhanced export functionality with better party detail handling
  const exportData = async (format = 'json') => {
    try {
      setLoading(true);
      
      // Show toast or alert that export is starting
      Alert.alert('Export Started', `Preparing ${format.toUpperCase()} export...`);
      
      // Check if we're exporting ledger data but missing party details
      const isLedgerExport = ledgerData?.transactions && ledgerData.transactions.length > 0;
      const hasPartyDetails = ledgerData?.party;
      
      if (isLedgerExport && !hasPartyDetails && selectedPartyType === 'supplier') {
        // Try to find the party details from the first transaction
        const firstTransaction = ledgerData.transactions[0];
        if (firstTransaction && firstTransaction.supplierId) {
          const supplierDetails = suppliers.find(s => s._id === firstTransaction.supplierId);
          if (supplierDetails) {
            ledgerData.party = {...supplierDetails, type: 'supplier'};
          }
        }
      } else if (isLedgerExport && !hasPartyDetails && selectedPartyType === 'customer') {
        // Try to find the party details from the first transaction
        const firstTransaction = ledgerData.transactions[0];
        if (firstTransaction && firstTransaction.customerId) {
          const customerDetails = customers.find(c => c._id === firstTransaction.customerId);
          if (customerDetails) {
            ledgerData.party = {...customerDetails, type: 'customer'};
          }
        }
      }
      
      const exportData = {
        financialSummary: data.financial,
        gstSummary: data.gst,
        ledgerData: ledgerData?.transactions || [],
        partyDetails: ledgerData?.party,
        exportDate: new Date().toISOString(),
        dateRange: {
          startDate: startDate?.toISOString() || 'All time',
          endDate: endDate?.toISOString() || 'All time',
        },
        selectedPartyType: selectedPartyType
      };

      switch (format) {
        case 'excel':
          await exportAsExcel(exportData);
          break;
        case 'pdf':
          await exportAsPDF(exportData);
          break;
        default:
          await exportAsJSON(exportData);
      }
      
      // Alert user when export is complete
      Alert.alert('Export Complete', `Your ${format.toUpperCase()} file has been exported successfully.`);
    } catch (error) {
      console.error(`Error exporting data as ${format}:`, error);
      Alert.alert('Export Error', `Failed to export as ${format}. ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  // JSON export (original method)
  const exportAsJSON = async (exportData) => {
    // Add a timestamp and format to the export filename
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    let filename = 'financial_export';
    
    // Add party info to filename if available
    if (exportData.partyDetails) {
      const partyName = exportData.selectedPartyType === 'supplier' 
        ? exportData.partyDetails.supplierName 
        : exportData.partyDetails.customerName;
      
      const sanitizedPartyName = partyName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      filename += `_${sanitizedPartyName}`;
    }
    
    // Add date range if present
    if (startDate && endDate) {
      const startStr = formatDate(startDate).replace(/\//g, '-');
      const endStr = formatDate(endDate).replace(/\//g, '-');
      filename += `_${startStr}_to_${endStr}`;
    }
    
    // Add timestamp
    filename += `_${timestamp}`;
    
    const fileString = JSON.stringify(exportData, null, 2);
    const fileUri = `${FileSystem.documentDirectory}${filename}.json`;
    
    await FileSystem.writeAsStringAsync(fileUri, fileString);
    await Sharing.shareAsync(fileUri);
  };

  // Excel export in Tally-like format
  const exportAsExcel = async (exportData) => {
    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new();
    
    // Ledger Sheet - TALLY STYLE
    if (exportData.ledgerData && exportData.ledgerData.length > 0) {
      let partyType = exportData.selectedPartyType || "party";
      let sheetName = partyType === 'supplier' ? 'Supplier Ledger' : 'Customer Ledger';
      const isSupplier = partyType === 'supplier';
      const partyDetails = exportData.partyDetails;
      
      // Get start date in proper format for title
      const periodStart = startDate ? formatDate(startDate) : '01-04-2023';
      const periodEnd = endDate ? formatDate(endDate) : formatDate(new Date());
      
      // Start with title and date range - Tally Style
      const ledgerData = [
        ['SATHE DAIRY'],
        [isSupplier ? 'SUPPLIER LEDGER' : 'CUSTOMER LEDGER'],
        [`Period: ${periodStart} to ${periodEnd}`],
        ['', '', '', '', '', '', ''],
      ];
      
      // Add party details if available - Tally Style
      if (partyDetails) {
        ledgerData.push([isSupplier ? 'Supplier Name' : 'Customer Name', ':', isSupplier ? partyDetails.supplierName : partyDetails.customerName]);
        ledgerData.push(['GSTIN', ':', isSupplier ? partyDetails.supplierGSTNo || 'N/A' : partyDetails.customerGSTNo || 'N/A']);
        ledgerData.push(['Address', ':', isSupplier ? partyDetails.supplierAddress || 'N/A' : partyDetails.customerAddress || 'N/A']);
        ledgerData.push(['Phone', ':', isSupplier ? partyDetails.supplierMobileNo || 'N/A' : partyDetails.contactNumber || 'N/A']);
        ledgerData.push(['', '', '', '', '', '', '']);
      }
      
      // Add transaction header - Tally Style
      ledgerData.push(['Date', 'Particulars', 'Voucher Type', 'Voucher No.', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)']);
      
      // Add opening line - Tally Style
      ledgerData.push([
        formatDate(startDate || new Date('2023-04-01')),
        'Opening Balance',
        '',
        '',
        '',
        '',
        '0.00'
      ]);
      
      // Add transaction data - Tally Style
      let balance = 0;
      let totalDebit = 0;
      let totalCredit = 0;
      
      exportData.ledgerData.forEach(transaction => {
        const isCustomer = partyType === 'customer';
        const amount = isCustomer ? transaction.total : transaction.amount;
        
        // In Tally, customer sales are typically credit for the customer
        // and supplier purchases are debit from supplier's perspective
        const debitAmount = isCustomer ? '' : amount;
        const creditAmount = isCustomer ? amount : '';
        
        if (debitAmount) totalDebit += parseFloat(debitAmount);
        if (creditAmount) totalCredit += parseFloat(creditAmount);
        
        balance += amount;
        
        ledgerData.push([
          formatDate(new Date(transaction.createdAt || transaction.date)),
          isCustomer ? 'Sales' : 'Purchase',
          isCustomer ? 'Sales' : 'Purchase',
          isCustomer ? `#${transaction.invoiceNo || 'N/A'}` : `PO #${transaction.purchaseOrderNumber || transaction.invoiceNo || 'N/A'}`,
          debitAmount,
          creditAmount,
          balance.toFixed(2)
        ]);
      });
      
      // Add closing balance line - Tally Style
      ledgerData.push([
        formatDate(endDate || new Date()),
        'Closing Balance',
        '',
        '',
        totalDebit.toFixed(2),
        totalCredit.toFixed(2),
        balance.toFixed(2)
      ]);
      
      // Add summary section - Tally Style
      ledgerData.push(['', '', '', '', '', '', '']);
      ledgerData.push(['SUMMARY', '', '', '', '', '', '']);
      ledgerData.push(['Opening Balance', '', '', '', '', '', '0.00']);
      ledgerData.push(['Total Transactions', '', '', '', '', '', exportData.ledgerData.length.toString()]);
      ledgerData.push(['Total Debit', '', '', '', '', '', totalDebit.toFixed(2)]);
      ledgerData.push(['Total Credit', '', '', '', '', '', totalCredit.toFixed(2)]);
      
      if (partyType === 'customer') {
        if (balance >= 0) {
          ledgerData.push(['Closing Balance', '', '', '', '', '', balance.toFixed(2) + ' Dr.']);
        } else {
          ledgerData.push(['Closing Balance', '', '', '', '', '', Math.abs(balance).toFixed(2) + ' Cr.']);
        }
      } else {
        // For supplier, the interpretation is reversed
        if (balance >= 0) {
          ledgerData.push(['Closing Balance', '', '', '', '', '', balance.toFixed(2) + ' Cr.']);
        } else {
          ledgerData.push(['Closing Balance', '', '', '', '', '', Math.abs(balance).toFixed(2) + ' Dr.']);
        }
      }
      
      const ledgerWS = XLSX.utils.aoa_to_sheet(ledgerData);
      
      // Set column widths - Tally Style
      const ledgerColWidths = [
        { wch: 12 },  // Date
        { wch: 30 },  // Particulars
        { wch: 15 },  // Voucher Type
        { wch: 15 },  // Voucher No.
        { wch: 15 },  // Debit
        { wch: 15 },  // Credit
        { wch: 15 }   // Balance
      ];
      ledgerWS['!cols'] = ledgerColWidths;
      
      // Apply enhanced Tally-like styling
      styleTallyLedgerExcelSheet(ledgerWS, ledgerData, partyDetails ? 5 : 0);
      
      XLSX.utils.book_append_sheet(workbook, ledgerWS, sheetName);
    }
    
    // Write workbook and share
    const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    
    // Create filename with appropriate naming convention
    const partyName = exportData.partyDetails 
      ? (exportData.selectedPartyType === 'supplier' 
          ? exportData.partyDetails.supplierName 
          : exportData.partyDetails.customerName)
      : 'report';
    
    // Sanitize party name for filename
    const sanitizedPartyName = partyName.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
    
    const fileUri = `${FileSystem.documentDirectory}sathe_dairy_ledger_${sanitizedPartyName}_${formatDate(startDate || new Date()).replace(/\//g, '-')}_to_${formatDate(endDate || new Date()).replace(/\//g, '-')}.xlsx`;
    
    await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: FileSystem.EncodingType.Base64 });
    await Sharing.shareAsync(fileUri);
  };

  // Enhanced Tally-style Excel styling for ledger
  const styleTallyLedgerExcelSheet = (worksheet, data, partyDetailsRows) => {
    // Set title rows to be merged
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Company name
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Report type
      { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }  // Date range
    ];
    
    // Add party detail field merges
    if (partyDetailsRows > 0) {
      for (let i = 4; i < 4 + partyDetailsRows; i++) {
        // First column remains as label, columns 2-7 merged for value
        merges.push({ s: { r: i, c: 2 }, e: { r: i, c: 6 } });
      }
    }
    
    // Merge the summary section rows
    const summaryStartRow = data.length - 6; // Adjust based on summary section size
    for (let i = summaryStartRow; i < data.length; i++) {
      // Merge cells for summary labels and values
      merges.push({ s: { r: i, c: 0 }, e: { r: i, c: 5 } });
    }
    
    worksheet['!merges'] = merges;
    
    // Define custom cell styles for Tally look
    // Note: XLSX doesn't support full styling, but we can add some formatting properties
    
    // Create a bold style for headers
    const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: "E8E8E8" } } };
    
    // Apply to header row
    const headerRowIndex = partyDetailsRows + 5; // Adjust based on where headers are
    for (let c = 0; c < 7; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c });
      if (!worksheet[cellRef]) worksheet[cellRef] = {};
      worksheet[cellRef].s = headerStyle;
    }
    
    // Style the closing balance row
    const closingRowIndex = data.length - 7; // Adjust based on where closing row is
    for (let c = 0; c < 7; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: closingRowIndex, c });
      if (!worksheet[cellRef]) worksheet[cellRef] = {};
      worksheet[cellRef].s = { font: { bold: true }, border: { bottom: { style: 'double', color: { rgb: "000000" } } } };
    }
  };

  // Helper function to format date
  const formatDate = (date) => {
    if (!date) return '';
    if (typeof date === 'string') date = new Date(date);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // PDF export with Tally-like format
  const exportAsPDF = async (exportData) => {
    try {
      // First, log what we're exporting to help debug
      console.log("Exporting PDF with data:", {
        hasFinancialData: !!exportData.financialSummary,
        hasGSTData: !!exportData.gstSummary,
        hasLedgerData: exportData.ledgerData && exportData.ledgerData.length > 0,
        partyType: exportData.selectedPartyType,
        hasPartyDetails: !!exportData.partyDetails
      });
      
      // Create HTML content for the PDF with Tally-specific styling
      let htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px;  
              margin-left: 40px;
              margin-right: 40px; 
              font-size: 12px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px; 
              
              padding-bottom: 10px;
            }
            .header h2 { margin: 5px 0; font-size: 16px; }
            .header h3 { margin: 5px 0; font-size: 14px; }
            .header p { margin: 3px 0; }
            
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 15px;
            }
            .title {
              border-top: 2px solid black;
              border-bottom: 2px solid black;
              font-size: 12px;
              font-weight: bold;
          
            }
            th, td { 
              padding: 5px; 
              text-align: left; 
            
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .number { text-decoration: underline; }
            
            /* Tally specific styles */
            .voucher-date { width: 12%; }
            .particulars { width: 30%; }
            .vch-type { width: 13%; }
            .vch-no { width: 15%; }
            .debit-col { width: 10%; text-align: right; }
            .credit-col { width: 10%; text-align: right; }
            .balance-col { width: 10%; text-align: right; }
            
            .summary-section {
              margin-top: 20px;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
            .summary-title {
              font-weight: bold;
              margin-bottom: 10px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .closing-row {
              font-weight: bold;
              text-align: right; 
              border-top: 1px solid #000;
              border-bottom: 2px double #000;
            }
            .opening-row {
              font-style: italic;
            }
            .signature-area {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              width: 200px;
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #000;
              margin-bottom: 5px;
            }
            .tally-footer {
              margin-top: 30px;
              font-size: 10px;
              text-align: center;
              font-style: italic;
              color: #666;
            }
              .bolddata{
                font-weight: bold;
              }
          </style>
        </head>
        <body>
      `;

      // Add Ledger page with Tally-like format
      if (exportData.ledgerData && exportData.ledgerData.length > 0) {
        let partyType = exportData.selectedPartyType || "party";
        const isSupplier = partyType === 'supplier';
        const isCustomer = partyType === 'customer'; 
        const partyDetails = exportData.partyDetails;
        
        // Get start date in proper format for title
        const periodStart = startDate ? formatDate(startDate) : '01-04-2023';
        const periodEnd = endDate ? formatDate(endDate) : formatDate(new Date());

        htmlContent += `
          <div class="header">
            <h2>Sathe's Dairy</h2>
            <p>Shop No.19 Suresh Heights, Wagh Pune</p>
            <p class="number">Contact: +91-8600070014</p>
            <h3>${isSupplier ? partyDetails?.supplierName : partyDetails?.customerName || 'Party'}</h3>
            <p>Ledger Account (${isSupplier ? 'Supplier' : 'Customer'})</p>
                 <p>${isSupplier ? partyDetails.supplierAddress || 'N/A' : partyDetails.customerAddress || 'N/A'}</p>
                 <p>${isSupplier ? partyDetails.supplierGSTNo || 'N/A' : partyDetails.customerGSTNo || 'N/A'}</p>
                 <p>${isSupplier ? partyDetails.supplierMobileNo || 'N/A' : partyDetails.contactNumber || 'N/A'}</p>
            <p>${periodStart} to ${periodEnd}</p>
       
          </div>
        `;

        // Add party details in Tally format
      

        // Add transactions table - Tally Style
        htmlContent += `
          <table>
            <thead>
              <tr>
                <th class="title voucher-date">Date</th>
                <th class="title particulars">Particulars</th>
                <th class="title vch-type">Vch Type</th>
                <th class="title vch-no">Vch No</th>
                <th class="title debit-col">Debit ₹</th>
                <th class="title credit-col">Credit ₹</th>
                <th class="title balance-col">Balance ₹</th>
              </tr>
            </thead>
            <tbody>
              <tr class="opening-row">
                <td >${periodStart}</td>
                <td class="bolddata">Opening Balance</td>
                <td></td>
                <td></td>
                <td class="text-right"></td>
                <td class="bolddata text-right"></td>
                <td class="text-right">0.00</td>
              </tr>
        `;

        let balance = 0;
        let totalDebit = 0;
        let totalCredit = 0;
        
        exportData.ledgerData.forEach(transaction => {
          // Use the defined variables to determine the amount
          const amount = isCustomer ? transaction.total : transaction.amount;
          
          // In Tally, customer sales are typically credit for the customer
          // and supplier purchases are debit from supplier's perspective
          const debitAmount = isCustomer ? '' : amount;
          const creditAmount = isCustomer ? amount : '';
          
          if (debitAmount) totalDebit += parseFloat(debitAmount);
          if (creditAmount) totalCredit += parseFloat(creditAmount);
          
          balance += amount;
          
          htmlContent += `
            <tr>
              <td>${formatDate(new Date(transaction.createdAt || transaction.date))}</td>
              <td class="bolddata">${isCustomer ? 'Sales' : 'Purchase'}</td>
              <td class="bolddata">${isCustomer ? 'Sales' : 'Purchase'}</td>
              <td>${isCustomer ? `#${transaction.invoiceNo || 'N/A'}` : `PO #${transaction.purchaseOrderNumber || transaction.invoiceNo || 'N/A'}`}</td>
              <td class="text-right">${debitAmount ? debitAmount.toFixed(2) : ''}</td>
              <td class="text-right">${creditAmount ? creditAmount.toFixed(2) : ''}</td>
              <td class="text-right">${balance.toFixed(2)}</td>
            </tr>
          `;
        });

        // Add closing balance line - Tally Style
        htmlContent += `
          <tr >
            <td>${periodEnd}</td>
            <td>Closing Balance</td>
            <td></td>
            <td></td>
            <td class="closing-row">${totalDebit.toFixed(2)}</td>
            <td class="closing-row">${totalCredit.toFixed(2)}</td>
            <td class="closing-row">${balance.toFixed(2)}</td>
          </tr>
          </tbody>
        </table>
        `;

       
        // Add signature section - Tally Style
       
      } else {
        // Add a fallback message if no ledger data is available
        htmlContent += `
          <div style="text-align: center; padding: 50px;">
            <h2>No Ledger Data Available</h2>
            <p>Please select a customer or supplier and try again.</p>
          </div>
        `;  
      }

      // Close HTML content
      htmlContent += `
        </body>
      </html>`;

      console.log("HTML content generated, length:", htmlContent.length);

      // Generate PDF with more detailed options and error handling
      try {
        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
          base64: false,
          width: 842, // A4 width in pixels at 96 DPI
          height: 1191 // A4 height in pixels at 96 DPI
        });
        
        console.log("PDF generated successfully at:", uri);

        // Share the PDF
        await Sharing.shareAsync(uri);
      } catch (printError) {
        console.error("Error generating PDF:", printError);
        Alert.alert(
          "PDF Generation Error", 
          "There was a problem creating the PDF. Please try again. Error: " + printError.message
        );
      }
    } catch (error) {
      console.error("Error in exportAsPDF function:", error);
      throw error; // Rethrow to be caught by the calling function
    }
  };

  // Helper function to format currency
  const formatCurrency = (value) => {
    return value.toLocaleString('en-IN', { 
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    });
  };

  // Update the export button to show options
  const ExportButton = ({ onPress }) => {
    const [showOptions, setShowOptions] = useState(false);
    
    return (
      <View>
        <TouchableOpacity 
          style={styles.exportButton} 
          onPress={() => setShowOptions(!showOptions)}
          activeOpacity={0.7}
        >
          <Text style={styles.exportButtonText}>Export Data</Text>
        </TouchableOpacity>
        
        {showOptions && (
          <View style={styles.exportOptions}>
            <TouchableOpacity 
              style={styles.exportOptionButton} 
              onPress={() => {
                setShowOptions(false);
                onPress('json');
              }}
            >
              <Text style={styles.exportOptionText}>JSON</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.exportOptionButton} 
              onPress={() => {
                setShowOptions(false);
                onPress('excel');
              }}
            >
              <Text style={styles.exportOptionText}>Excel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.exportOptionButton} 
              onPress={() => {
                setShowOptions(false);
                onPress('pdf');
              }}
            >
              <Text style={styles.exportOptionText}>PDF</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Render financial metrics with exactly two cards per row
  const FinancialMetrics = ({ data }) => {
    if (!data) return null;
    
    const { width } = useWindowDimensions();
    const containerPadding = 16;
    const cardGap = 16;
    
    const containerWidth = width - (containerPadding * 2) - 32;
    const cardWidth = (containerWidth - cardGap) / 2;
    
    // Enhanced metrics with improved UI
    const metrics = [
      { label: 'Total Revenue', value: data.totalRevenue, icon: '📈', bgColor: '#e6f7ff', iconColor: '#1890ff', trend: 'up' },
      { label: 'Total COGS', value: data.totalCOGS, icon: '💰', bgColor: '#f6ffed', iconColor: '#52c41a', trend: 'neutral' },
      { label: 'Gross Profit', value: data.grossProfit, icon: '💵', bgColor: '#fff7e6', iconColor: '#fa8c16', trend: 'up' },
      { label: 'Total Purchases', value: data.totalPurchases, icon: '🛒', bgColor: '#fff0f6', iconColor: '#eb2f96', trend: 'down' },
      { label: 'Transport Cost', value: data.totalTransportCost, icon: '🚚', bgColor: '#f9f0ff', iconColor: '#722ed1', trend: 'neutral' },
      { label: 'Inventory Value', value: data.inventoryValuation, icon: '📦', bgColor: '#fcffe6', iconColor: '#a0d911', trend: 'up' },
      { label: 'Outstanding', value: data.outstandingPayments, icon: '⏳', bgColor: '#fff2e8', iconColor: '#fa541c', trend: 'neutral' },
      { label: 'Credit Sales', value: data.creditSales, icon: '💳', bgColor: '#e6fffb', iconColor: '#13c2c2', trend: 'down' },
    ];

    return (
      <View style={styles.metricsWrapper}>
        <Text style={styles.sectionTitle}>Financial Summary</Text>
        <View style={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <View 
              key={index} 
              style={{
                width: cardWidth,
                marginBottom: 16,
                marginRight: index % 2 === 0 ? cardGap : 0,
              }}
            >
              <Card style={[styles.metricCard, { backgroundColor: metric.bgColor }]}>
                <Card.Content style={styles.metricContent}>
                  <View style={styles.metricIconContainer}>
                    <Text style={[styles.metricIcon, { color: metric.iconColor }]}>{metric.icon}</Text>
                    {metric.trend === 'up' && <Text style={styles.trendIcon}>↑</Text>}
                    {metric.trend === 'down' && <Text style={[styles.trendIcon, styles.trendDown]}>↓</Text>}
                  </View>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <Text style={styles.metricValue}>
                    ₹{metric.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </Text>
                </Card.Content>
              </Card>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // New Summary Statistics Component
  const SummaryStatistics = ({ data }) => {
    if (!data?.financial) return null;

    const stats = [
      {
        title: 'Profit Margin',
        value: data.financial.totalRevenue > 0 
          ? (data.financial.grossProfit / data.financial.totalRevenue * 100).toFixed(1) + '%'
          : '0%',
        color: '#4CAF50'
      },
      {
        title: 'Total Transactions',
        value: (data.gst?.salesByGST?.length || 0) + (data.gst?.purchasesByGST?.length || 0),
        color: '#2196F3'
      },
      {
        title: 'Outstanding Ratio',
        value: data.financial.totalRevenue > 0 
          ? (data.financial.outstandingPayments / data.financial.totalRevenue * 100).toFixed(1) + '%'
          : '0%',
        color: data.financial.outstandingPayments / data.financial.totalRevenue > 0.2 ? '#FF5722' : '#4CAF50'
      },
      {
        title: 'Cash Flow',
        value: (data.financial.totalRevenue - data.financial.totalPurchases).toLocaleString('en-IN', { 
          style: 'currency', 
          currency: 'INR',
          maximumFractionDigits: 0
        }),
        color: (data.financial.totalRevenue - data.financial.totalPurchases) >= 0 ? '#4CAF50' : '#FF5722'
      }
    ];

    return (
      <View style={styles.summaryStatsWrapper}>
        <View style={styles.summaryStatsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue} numberOfLines={1}>
                <Text style={{ color: stat.color }}>{stat.value}</Text>
              </Text>
              <Text style={styles.summaryStatTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Enhanced GST summary with better visualization
  const GSTSummaryWithLedger = ({ data }) => {
    if (!data) return null;
    
    const { width } = useWindowDimensions();
    const isSmallScreen = width < 380;

    const openLedger = (type, gstNo) => {
      setSelectedPartyType(type);
      setSelectedPartyId(gstNo);
      fetchLedgerData(type, gstNo);
    };

    // Calculate totals for better context
    const totalSales = data.salesByGST.reduce((sum, item) => sum + item.totalSales, 0);
    const totalPurchases = data.purchasesByGST.reduce((sum, item) => sum + item.totalPurchases, 0);

    return (
      <View style={styles.gstWrapper}>
        <View style={styles.gstHeader}>
          <Text style={styles.sectionTitle}>GST Summary</Text>
          
          {/* GST Statistics */}
          <View style={styles.gstStatContainer}>
            <View style={styles.gstStatItem}>
              <Text style={styles.gstStatLabel}>Total GST Parties</Text>
              <Text style={styles.gstStatValue}>{data.salesByGST.length + data.purchasesByGST.length}</Text>
            </View>
            <View style={styles.gstStatDivider} />
            <View style={styles.gstStatItem}>
              <Text style={styles.gstStatLabel}>Sales Volume</Text>
              <Text style={[styles.gstStatValue, { color: '#4CAF50' }]}>
                ₹{totalSales.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.gstStatDivider} />
            <View style={styles.gstStatItem}>
              <Text style={styles.gstStatLabel}>Purchase Volume</Text>
              <Text style={[styles.gstStatValue, { color: '#FF5722' }]}>
                ₹{totalPurchases.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.gstContainer}>
          {isSmallScreen ? (
            // Compact layout for small screens
            <>
              <View style={styles.gstTableHeader}>
                <Text style={[styles.gstHeaderText, { flex: 1.2 }]}>GST Number</Text>
                <Text style={[styles.gstHeaderText, { flex: 0.8 }]}>Type</Text>
                <Text style={[styles.gstHeaderText, { flex: 1 }]}>Amount</Text>
              </View>
              
              <ScrollView style={styles.gstTableBody}>
                {data.salesByGST.map((item, index) => (
                  <TouchableOpacity 
                    key={`sales-${index}`} 
                    style={[styles.gstRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}
                    onPress={() => openLedger('customer', item._id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.gstCell, { flex: 1.2 }]} numberOfLines={1} ellipsizeMode="tail">
                      {item._id || 'N/A'}
                    </Text>
                    <Text style={[styles.gstCell, styles.typeSalesCell, { flex: 0.8 }]}>Sales</Text>
                    <Text style={[styles.gstCell, styles.amountCell, { flex: 1 }]}>
                      ₹{item.totalSales.toLocaleString('en-IN')}
                    </Text>
                  </TouchableOpacity>
                ))}
                
                {data.purchasesByGST.map((item, index) => (
                  <TouchableOpacity 
                    key={`purchase-${index}`} 
                    style={[styles.gstRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}
                    onPress={() => openLedger('supplier', item._id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.gstCell, { flex: 1.2 }]} numberOfLines={1} ellipsizeMode="tail">
                      {item._id || 'N/A'}
                    </Text>
                    <Text style={[styles.gstCell, styles.typePurchaseCell, { flex: 0.8 }]}>Purchase</Text>
                    <Text style={[styles.gstCell, styles.amountCell, { flex: 1 }]}>
                      ₹{item.totalPurchases.toLocaleString('en-IN')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          ) : (
            // Standard layout for normal screens - now with percentages
            <>
              <View style={styles.gstTableHeader}>
                <Text style={[styles.gstHeaderText, { flex: 1.2 }]}>GST Number</Text>
                <Text style={[styles.gstHeaderText, { flex: 0.8 }]}>Type</Text>
                <Text style={[styles.gstHeaderText, { flex: 1 }]}>Amount</Text>
                <Text style={[styles.gstHeaderText, { flex: 0.7 }]}>%</Text>
                <Text style={[styles.gstHeaderText, { flex: 1 }]}>Actions</Text>
              </View>
              
              <ScrollView style={styles.gstTableBody}>
                {data.salesByGST.map((item, index) => (
                  <View key={`sales-${index}`} style={[styles.gstRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
                    <Text style={[styles.gstCell, { flex: 1.2 }]} numberOfLines={1} ellipsizeMode="tail">
                      {item._id || 'N/A'}
                    </Text>
                    <Text style={[styles.gstCell, styles.typeSalesCell, { flex: 0.8 }]}>Sales</Text>
                    <Text style={[styles.gstCell, styles.amountCell, { flex: 1 }]}>
                      ₹{item.totalSales.toLocaleString('en-IN')}
                    </Text>
                    <Text style={[styles.gstCell, { flex: 0.7 }]}>
                      {totalSales ? ((item.totalSales / totalSales) * 100).toFixed(1) + '%' : '0%'}
                    </Text>
                    <View style={[styles.actionCell, { flex: 1 }]}>
                      <TouchableOpacity
                        style={styles.ledgerButton}
                        onPress={() => openLedger('customer', item._id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.ledgerButtonText}>View Ledger</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                
                {data.purchasesByGST.map((item, index) => (
                  <View key={`purchase-${index}`} style={[styles.gstRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
                    <Text style={[styles.gstCell, { flex: 1.2 }]} numberOfLines={1} ellipsizeMode="tail">
                      {item._id || 'N/A'}
                    </Text>
                    <Text style={[styles.gstCell, styles.typePurchaseCell, { flex: 0.8 }]}>Purchase</Text>
                    <Text style={[styles.gstCell, styles.amountCell, { flex: 1 }]}>
                      ₹{item.totalPurchases.toLocaleString('en-IN')}
                    </Text>
                    <Text style={[styles.gstCell, { flex: 0.7 }]}>
                      {totalPurchases ? ((item.totalPurchases / totalPurchases) * 100).toFixed(1) + '%' : '0%'}
                    </Text>
                    <View style={[styles.actionCell, { flex: 1 }]}>
                      <TouchableOpacity
                        style={styles.ledgerButton}
                        onPress={() => openLedger('supplier', item._id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.ledgerButtonText}>View Ledger</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </>
          )}
        </View>
        
        {isSmallScreen && (
          <Text style={styles.tapHintText}>
            Tap on any row to view detailed ledger
          </Text>
        )}
      </View>
    );
  };

  // Create a new component to display party details
  const PartyDetailsCard = ({ party, type }) => {
    if (!party) return null;
    
    const isSupplier = type === 'supplier';
    
    return (
      <View style={styles.partyDetailsCard}>
        <Text style={styles.partyDetailsTitle}>
          {isSupplier ? 'Supplier Details' : 'Customer Details'}
        </Text>
        
        <View style={styles.partyDetailsRow}>
          <View style={styles.partyDetailsColumn}>
            <Text style={styles.partyDetailsLabel}>Name:</Text>
            <Text style={styles.partyDetailsValue}>
              {isSupplier ? party.supplierName : party.customerName}
            </Text>
          </View>
          
          <View style={styles.partyDetailsColumn}>
            <Text style={styles.partyDetailsLabel}>GST Number:</Text>
            <Text style={styles.partyDetailsValue}>
              {isSupplier ? party.supplierGSTNo : party.customerGSTNo || 'N/A'}
            </Text>
          </View>
        </View>
        
        <View style={styles.partyDetailsRow}>
          <View style={styles.partyDetailsColumn}>
            <Text style={styles.partyDetailsLabel}>Contact:</Text>
            <Text style={styles.partyDetailsValue}>
              {isSupplier ? party.supplierMobileNo : party.contactNumber || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.partyDetailsColumn}>
            <Text style={styles.partyDetailsLabel}>Email:</Text>
            <Text style={styles.partyDetailsValue}>
              {isSupplier ? party.supplierEmailId : party.customerEmailId || 'N/A'}
            </Text>
          </View>
        </View>
        
        <View style={styles.partyDetailsRow}>
          <View style={styles.partyDetailsFullColumn}>
            <Text style={styles.partyDetailsLabel}>Address:</Text>
            <Text style={styles.partyDetailsValue}>
              {isSupplier ? party.supplierAddress : party.customerAddress || 'N/A'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Add a fallback component for missing party details in ledger view
  const MissingPartyDetailsCard = ({ type, gstNumber }) => {
    return (
      <View style={[styles.partyDetailsCard, { backgroundColor: '#FFF8F7' }]}>
        <Text style={styles.partyDetailsTitle}>
          {type === 'supplier' ? 'Supplier Details' : 'Customer Details'} (Limited Information)
        </Text>
        
        <View style={styles.partyDetailsRow}>
          <View style={styles.partyDetailsFullColumn}>
            <Text style={styles.partyDetailsLabel}>GST Number:</Text>
            <Text style={styles.partyDetailsValue}>
              {gstNumber || 'N/A'}
            </Text>
          </View>
        </View>
        
        <Text style={{ color: '#D32F2F', marginTop: 10, fontSize: 14 }}>
          Note: Complete party details are not available for this GST number. 
          Only GST-based transaction data is shown.
        </Text>
      </View>
    );
  };

  // Update the LedgerModal to use fallback when party details are missing
  const LedgerModal = () => {
    if (!showLedgerModal) return null; // Only render when visible
    
    // Check if we have a GST number but no party details
    const isGstOnlyView = !ledgerData?.party && selectedPartyId && 
                         (typeof selectedPartyId === 'string' && 
                          (selectedPartyId.startsWith('GST') || 
                           selectedPartyId.length !== 24 || 
                           !/^[0-9a-fA-F]{24}$/.test(selectedPartyId)));
    
    return (
      <Modal
        visible={showLedgerModal}
        animationType="slide"
        onRequestClose={() => setShowLedgerModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedPartyType === 'customer' ? 'Customer' : 'Supplier'} Ledger
            </Text>
            <TouchableOpacity
              onPress={() => setShowLedgerModal(false)}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
          
          {/* Party Details Section - with fallback */}
          {ledgerData?.party ? (
            <PartyDetailsCard 
              party={ledgerData.party} 
              type={selectedPartyType}
            />
          ) : isGstOnlyView ? (
            <MissingPartyDetailsCard 
              type={selectedPartyType}
              gstNumber={selectedPartyId}
            />
          ) : null}
          
          <Searchbar
            placeholder="Search transactions..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            iconColor="#3E7BFA"
          />

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#3E7BFA" style={styles.loader} />
              <Text style={styles.loaderText}>Loading ledger data...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <ScrollView>
              <LedgerTransactions
                data={ledgerData}
                type={selectedPartyType}
              />
            </ScrollView>
          )}
          
          <View style={styles.exportButtonContainer}>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => exportData('excel')}
              activeOpacity={0.7}
            >
              <Text style={styles.exportButtonText}>Excel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => exportData('pdf')}
              activeOpacity={0.7}
            >
              <Text style={styles.exportButtonText}>PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Improved header with better responsive layout
  const ReportHeader = () => {
    const { width } = useWindowDimensions();
    const isSmallScreen = width < 500;
    
    // Add new function to clear date filters
    const clearFilters = () => {
      setStartDate(null);
      setEndDate(null);
      setSelectedPartyId(null);
      setSelectedPartyType(null);
      setLedgerData(null);
      // Refresh data without filters
      fetchData();
    };
    
    return (
      <View style={styles.headerWrapper}>
        <View style={[styles.header, isSmallScreen && styles.headerSmallScreen]}>
          <View style={[styles.dateContainer, isSmallScreen && styles.dateContainerSmall]}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.dateButtonLabel}>Start Date</Text>
              <Text style={styles.dateButtonText}>{startDate ? startDate.toLocaleDateString() : 'All Time'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.dateButtonLabel}>End Date</Text>
              <Text style={styles.dateButtonText}>{endDate ? endDate.toLocaleDateString() : 'All Time'}</Text>
            </TouchableOpacity>
            
            {/* Improved Clear Filters button */}
            {(startDate || endDate || selectedPartyId) && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearFilters}
                activeOpacity={0.7}
              >
                <Text style={styles.clearFiltersText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
          <ExportButton onPress={exportData} />
        </View>

        <PartySelectionButtons />
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {userRole !== 'admin' ? (
        <View style={styles.accessDeniedContainer}>
          <Text style={styles.accessDeniedText}>Access Denied</Text>
          <Text style={styles.accessDeniedSubtext}>Only admin users can view this page</Text>
        </View>
      ) : (
        <>
          <ReportHeader />

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
              <Text style={styles.loaderText}>Loading data...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={fetchData}
                activeOpacity={0.7}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <SummaryStatistics data={data} />
              <FinancialMetrics data={data.financial} />
              <GSTSummaryWithLedger data={data.gst} />
            </>
          )}
        </>
      )}

      <PartyListModal
        visible={showCustomerList}
        onClose={() => {
          setShowCustomerList(false);
          setPartySearchQuery('');
        }}
        parties={customers}
        type="customer"
        onSelect={(id) => {
          setSelectedPartyType('customer');
          setSelectedPartyId(id);
          fetchLedgerData('customer', id);
        }}
      />

      <PartyListModal
        visible={showSupplierList}
        onClose={() => {
          setShowSupplierList(false);
          setPartySearchQuery('');
        }}
        parties={suppliers}
        type="supplier"
        onSelect={(id) => {
          setSelectedPartyType('supplier');
          setSelectedPartyId(id);
          fetchLedgerData('supplier', id);
        }}
      />

      <LedgerModal />

      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="default"
          onChange={onStartDateChange}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="default"
          onChange={onEndDateChange}
        />
      )}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E6ED',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dateButton: {
    padding: 12,
    backgroundColor: '#EBF5FF',
    borderRadius: 12,
    minWidth: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C9E3FF',
  },
  dateButtonLabel: {
    fontSize: 12,
    color: '#3E7BFA',
    marginBottom: 4,
    fontWeight: '600',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  exportButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Party selection section
  partyButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    flexWrap: 'wrap',
    gap: 16,
  },
  partyButton: {
    backgroundColor: '#3E7BFA',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    minWidth: 150,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  partyButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Metrics section
  metricsWrapper: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    elevation: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  metricContent: {
    padding: 12,
  },
  metricIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIcon: {
    fontSize: 24,
    marginRight: 4,
  },
  trendIcon: {
    fontSize: 16,
    color: '#52c41a',
    fontWeight: 'bold',
  },
  trendDown: {
    color: '#f5222d',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  
  // GST section - improved responsiveness
  gstWrapper: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gstContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  gstTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F0F4F8',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E6ED',
  },
  gstHeaderText: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
    textAlign: 'center',
  },
  gstTableBody: {
    maxHeight: 400,
  },
  gstRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E6ED',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  gstCell: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  typeSalesCell: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  typePurchaseCell: {
    color: '#FF5722',
    fontWeight: '600',
  },
  amountCell: {
    fontWeight: '600',
  },
  actionCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerButton: {
    backgroundColor: '#3E7BFA',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ledgerButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tapHintText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  
  // Ledger section
  ledgerContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
  },
  ledgerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E6ED',
    paddingBottom: 8,
  },
  ledgerTable: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  tableHeader: {
    backgroundColor: '#F0F4F8',
  },
  tableColumnDate: {
    flex: 1,
    ...Platform.select({
      android: {
        fontSize: 12,
      },
    }),
  },
  tableColumnInvoice: {
    flex: 1.2,
  },
  tableColumnAmount: {
    flex: 0.8,
    paddingRight: 8,
  },
  tableColumnBalance: {
    flex: 0.8,
    paddingRight: 8,
  },
  amountText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  balanceText: {
    fontWeight: '600',
  },
  evenRow: {
    backgroundColor: '#F9FAFB',
  },
  oddRow: {
    backgroundColor: '#FFFFFF',
  },
  
  // Loading and Error states
  loaderContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loader: {
    marginBottom: 16,
  },
  loaderText: {
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#FFF8F7',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFDAD7',
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
    padding: 8,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#D32F2F',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    minWidth: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E6ED',
    backgroundColor: '#3E7BFA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchBar: {
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#F5F7FA',
  },
  partyListContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  // Party items - more modern design
  partyItem: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  partyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  partyGst: {
    fontSize: 14,
    color: '#666',
  },
  
  // Access denied
  accessDeniedContainer: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8F7',
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFDAD7',
    minHeight: 200,
  },
  accessDeniedText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 8,
  },
  accessDeniedSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  exportOptions: {
    position: 'absolute',
    right: 0,
    top: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E6ED',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 100,
    overflow: 'hidden',
  },
  exportOptionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E6ED',
  },
  exportOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  
  // Party Details Card
  partyDetailsCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E6ED',
    marginBottom: 20,
  },
  partyDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E6ED',
    paddingBottom: 8,
  },
  partyDetailsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  partyDetailsColumn: {
    flex: 1,
    minWidth: 150,
  },
  partyDetailsFullColumn: {
    flex: 1,
    width: '100%',
  },
  partyDetailsLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  partyDetailsValue: {
    fontSize: 16,
    color: '#333',
  },
  
  // Export button container
  exportButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E6ED',
    backgroundColor: '#f9f9f9',
  },
  // Responsive header styles
  headerSmallScreen: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  dateContainerSmall: {
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  metricsContainerNarrow: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  metricCardMargin: {
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  clearFiltersButton: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    minWidth: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    flexDirection: 'row',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },
  
  // Summary Statistics styles
  summaryStatsWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  summaryStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    padding: 16,
  },
  summaryStatItem: {
    width: '48%',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  summaryStatValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryStatTitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  
  // Enhanced GST section
  gstHeader: {
    marginBottom: 16,
  },
  gstStatContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },
  gstStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  gstStatLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  gstStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
  },
  gstStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E6ED',
    marginHorizontal: 8,
  },
});

export default ReportScreen;