import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Store,
  MapPin,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Shield,
  Globe,
  Star,
  AlertCircle,
  CheckCheck,
  Map,
  MessageCircle,
  Building
} from 'lucide-react';
import axiosInstance from '../services/axiosConfig';
import { toast } from 'react-toastify';

const SellerModal = ({ isOpen, onClose, seller, onApprove, onReject, loading }) => {
  const [showValidation, setShowValidation] = useState(false);
  const [sendingReviewIssues, setSendingReviewIssues] = useState(false)

  if (!isOpen) return null;

  const hasExternalContactInfo = (text, allowedDomains = []) => {
    if (!text) return false;

    const normalized = text.toLowerCase().replace(/[-\s.()]/g, '');
    console.log("Normalized Text:", normalized);
    // Phone number patterns
    const phonePatterns = [
      /\+\d{10,15}/, // +254794338999
      /254\d{9}/, // 254794338999
      /0[17]\d{8}/, // 0794338999 or 0174338999
      /\d{10,15}/ // Any 10-15 digit sequence
    ];

    // Contact context patterns
    const contactContexts = [
      /call[\s\d]{5,15}/,
      /phone[\s\d]{5,15}/,
      /contact[\s\d]{5,15}/,
      /tel[\s\d]{5,15}/,
      /mobile[\s\d]{5,15}/,
      /reach[\s\w]{1,10}[\s\d]{5,15}/,
      /whatsapp[\s\d]{5,15}/,
      /sms[\s\d]{5,15}/
    ];

    // Email patterns
    const emailPatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
    ];

    // External link patterns (excluding allowed domains)
    const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9-]+\.[a-z]{2,}(\/[^\s]*)?)/gi;
    const links = text.match(linkRegex) || [];

    const hasExternalLinks = links.some(link => {
      // Check if link is not from allowed domains
      const isAllowed = allowedDomains.some(domain =>
        link.toLowerCase().includes(domain.toLowerCase())
      );
      return !isAllowed;
    });

    const hasPhone = phonePatterns.some(pattern => {
      const match = normalized.match(pattern);
      if (match) {
        console.log("Found phone match:", match[0]);
        return true;
      }
      return false;
    });
    console.log("Phone Check:", hasPhone);
    const hasContactContext = contactContexts.some(pattern => pattern.test(normalized));
    const hasEmail = emailPatterns.some(pattern => pattern.test(text));

    return hasPhone || hasContactContext || hasEmail || hasExternalLinks;
  };

  // Usage with your allowed domains
  const hasProhibitedInfo = hasExternalContactInfo(seller.storeDescription, [
    'ikosoko.com'
  ]);
  console.log("Prohibited Info Check:", hasProhibitedInfo);

  // Comprehensive validation checks
  const validationChecks = useMemo(() => {
    if (!seller) return [];
    const isIndividual = seller.seller_type === 'individual';

    const checks = [
      {
        id: 'email-verified',
        label: 'Email Verification',
        description: 'Seller email must be verified',
        status: seller.emailVerified,
        required: true,
        category: 'account'
      },
      {
        id: 'contact-details',
        label: 'Contact Details',
        description: 'Valid phone number and email provided',
        status: seller.phone && seller.phone.length >= 10 && seller.email,
        required: true,
        category: 'contact'
      },
      {
        id: 'store-location',
        label: 'Store Location',
        description: 'Complete location details provided',
        status: seller.country && seller.county && seller.city && seller.address,
        required: true,
        category: 'location'
      },
      {
        id: 'allowed-location',
        label: 'Allowed Location',
        description: 'Business location within service areas',
        status: isLocationAllowed(seller),
        required: true,
        category: 'location'
      },
      {
        id: 'business-details',
        label: 'Business Details',
        description: 'Complete business information provided',
        status: seller.storeName && seller.businessType,
        required: true,
        category: 'business'
      },
      {
        id: 'kra-pin',
        label: 'KRA PIN',
        description: 'Valid KRA PIN provided for tax purposes',
        status: seller.kraPin || seller.profile?.kraPin,
        required: isIndividual ? false : true,
        category: 'legal'
      },
      {
        id: 'payment-method',
        label: 'Payment Method',
        description: 'Valid payment method configured',
        status: isPaymentMethodValid(seller),
        required: true,
        category: 'financial'
      },
      {
        id: 'store-description',
        label: 'Store Description',
        description: 'Store description without external contact info or links',
        status: seller.storeDescription &&
          seller.storeDescription.length >= 50 &&
          !hasProhibitedInfo,
        required: true,
        category: 'business'
      },
      {
        id: 'return-policy',
        label: 'Return Policy',
        description: 'Clear return policy defined',
        status: seller.returnPolicy && seller.returnPolicy > 0,
        required: false,
        category: 'policies'
      },
      {
        id: 'store-policy',
        label: 'Store Policy',
        description: 'Store policies clearly defined',
        status: seller.storePolicy && seller.storePolicy.length >= 30,
        required: false,
        category: 'policies'
      },
      {
        id: 'business-registration',
        label: 'Business Registration',
        description: 'Business registration number provided',
        status: seller.businessRegistrationNumber,
        required: seller.seller_type === 'business',
        category: 'legal'
      },
      {
        id: 'bank-details',
        label: 'Bank Details',
        description: 'Complete bank account information',
        status: isBankDetailsComplete(seller),
        required: seller.paymentMethod === 'BANK',
        category: 'financial'
      },
      {
        id: 'mpesa-details',
        label: 'M-Pesa Details',
        description: 'Valid M-Pesa number registered',
        status: (() => {
          if (!seller.mpesaNumber) return false;
          const normalized = String(seller.mpesaNumber).replace(/\D/g, '');
          const validPrefixes = ['254', '07', '01'];
          const hasValidPrefix = validPrefixes.some(p => normalized.startsWith(p));
          const validLength = normalized.length === 12 || normalized.length === 10;
          return hasValidPrefix && validLength;
        })(),
        required: seller.paymentMethod === 'MPESA',
        category: 'financial'
      }
    ];

    return checks;
  }, [seller]);

  const getFailedValidationsForEmail = () => {
    if (!seller) return [];

    const failedValidations = validationChecks
      .filter(check => check.required && !check.status)
      .map(check => {
        // Add specific guidance for each failed validation
        const guidance = getValidationGuidance(check.id, seller);
        return {
          id: check.id,
          label: check.label,
          description: check.description,
          category: check.category,
          guidance: guidance,
          requiredFields: getRequiredFieldsForCheck(check.id)
        };
      });

    return failedValidations;
  };

  // Helper function to provide specific guidance
  const getValidationGuidance = (checkId, seller) => {
    const guidanceMap = {
      'email-verified': 'Please verify your email address by clicking the link sent to your inbox.',
      'contact-details': 'Please provide a valid phone number (10+ digits) and email address.',
      'store-location': 'Please complete your location details including country, county, city, and address.',
      'allowed-location': 'Your business location is not within our current service areas.',
      'business-details': 'Please provide your store name and select a business type.',
      'kra-pin': 'Please provide a valid KRA PIN for tax purposes.',
      'payment-method': 'Please configure a valid payment method (Bank or M-Pesa).',
      'store-description': 'Please provide a store description (minimum 50 characters) without external contact information.',
      'bank-details': 'Please complete your bank account details including account number and bank name.',
      'mpesa-details': 'Please provide a valid M-Pesa number in format 2547XXXXXXXX or 07XXXXXXXX.'
    };

    return guidanceMap[checkId] || 'Please complete this requirement to continue.';
  };

  // Helper function to list required fields for each check
  const getRequiredFieldsForCheck = (checkId) => {
    const fieldsMap = {
      'email-verified': ['emailVerified'],
      'contact-details': ['phone', 'email'],
      'store-location': ['country', 'county', 'city', 'address'],
      'allowed-location': ['county', 'city'],
      'business-details': ['storeName', 'businessType'],
      'kra-pin': ['kraPin'],
      'payment-method': ['paymentMethod'],
      'store-description': ['storeDescription'],
      'bank-details': ['accountNumber', 'bankName', 'branchName'],
      'mpesa-details': ['mpesaNumber']
    };

    return fieldsMap[checkId] || [];
  };

  console.log(getFailedValidationsForEmail());
  const prepareEmailPayload = () => {
    const failedValidations = getFailedValidationsForEmail();
    const baseApi = import.meta.env.VITE_APP_API_URL

    return {
      seller: {
        id: seller.id,
        email: seller.email,
        name: seller.storeName || seller.profile?.name,
        type: seller.seller_type
      },
      validationSummary: {
        totalRequired: validationChecks.filter(check => check.required).length,
        passed: validationChecks.filter(check => check.required && check.status).length,
        failed: failedValidations.length,
        completionPercentage: Math.round(
          (validationChecks.filter(check => check.required && check.status).length /
            validationChecks.filter(check => check.required).length) * 100
        )
      },
      failedValidations: failedValidations,
      actionRequired: {
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        priority: failedValidations.length > 3 ? 'HIGH' : failedValidations.length > 1 ? 'MEDIUM' : 'LOW'
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'seller-dashboard'
      }
    };
  };
  // Final function to send everything
  const sendValidationReminder = async () => {
    setSendingReviewIssues(true)
    try {
      const payload = prepareEmailPayload();

      if (payload.failedValidations.length === 0) {
        toast.success('Seller has completed all required validations!');
        return;
      }

      const response = await axiosInstance.post(`/sellers/send-validation-reminder`, payload);

      if (response.data.success) {
        toast.success(`Validation reminder sent for ${payload.failedValidations.length} issue(s)`);

        // Optional: Log this action
        console.log('Validation reminder sent:', {
          sellerId: seller.id,
          failedCount: payload.failedValidations.length,
          categories: [...new Set(payload.failedValidations.map(f => f.category))]
        });
      }
    } catch (error) {
      console.error('Failed to send validation reminder:', error);
      toast.error('Failed to send validation reminder');
    } finally {
      setSendingReviewIssues(false)
    }
  };
  // Helper functions for validation
  async function isLocationAllowed(seller) {
    try {
      // Fetch locations from API
      const res = await axiosInstance.get(`/location/all`);
      const locations = res.data.data;

      // Extract allowed counties and towns from API response
      const allowedCounties = locations.map(loc => loc.name).filter(Boolean);
      const allowedTowns = locations.flatMap(loc =>
        loc.towns?.map(town => town.name) || []
      ).filter(Boolean);

      console.log('Allowed Counties:', allowedCounties);
      console.log('Allowed Towns:', allowedTowns);
      console.log('Seller Data:', seller);

      // Check if seller has the required location data
      if (!seller) {
        console.log('No seller data provided');
        return false;
      }

      // Check if seller is in allowed county or town
      const isAllowed = allowedCounties.includes(seller.county) ||
        allowedTowns.includes(seller.city) ||
        (seller.country === 'Kenya' && seller.county);

      console.log('Location allowed:', isAllowed);
      return isAllowed;
    } catch (error) {
      console.error('Error fetching locations:', error);
      return false;
    }
  }
  function isPaymentMethodValid(seller) {
    if (!seller.paymentMethod) return false;

    switch (seller.paymentMethod) {
      case 'BANK':
        return seller.bankName && seller.accountNumber && seller.accountHolderName;
      case 'MPESA':
        return seller.mpesaNumber && seller.mpesaName;
      case 'JENGA':
        return seller.jengaAccountNumber && seller.jengaAccountName;
      case 'PAYPAL':
        return seller.paypalEmail && seller.paypalAccountHolder;
      default:
        return false;
    }
  }

  function isBankDetailsComplete(seller) {
    return seller.bankName &&
      seller.accountNumber &&
      seller.accountHolderName &&
      seller.accountNumber.length >= 10;
  }

  // Calculate validation scores
  const validationResults = useMemo(() => {
    const requiredChecks = validationChecks.filter(check => check.required);
    const optionalChecks = validationChecks.filter(check => !check.required);

    const passedRequired = requiredChecks.filter(check => check.status).length;
    const passedOptional = optionalChecks.filter(check => check.status).length;

    const totalRequired = requiredChecks.length;
    const totalOptional = optionalChecks.length;

    const requiredScore = totalRequired > 0 ? (passedRequired / totalRequired) * 100 : 100;
    const overallScore = ((passedRequired + passedOptional) / validationChecks.length) * 100;

    const isEligible = passedRequired === totalRequired;

    return {
      requiredScore,
      overallScore,
      isEligible,
      passedRequired,
      totalRequired,
      passedOptional,
      totalOptional
    };
  }, [validationChecks]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-orange-600 bg-orange-50 border-orange-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleApproveWithValidation = () => {
    if (!validationResults.isEligible) {
      setShowValidation(true);
      return;
    }
    onApprove(seller.id);
  };

  // calculate the remaining time for reviewing the seller application. which is 48 hours from the createdAt time if approved set the text to "Approved" if not and the period has ended show needing action els show the remaining time
  const getReviewTimeStatus = () => {
    if (seller.approvalStatus === 'approved') {
      return { text: 'Approved', color: 'text-green-600' };
    }
    const createdAt = new Date(seller.created_at);
    const now = new Date();
    const diffMs = now - createdAt;
    const diffHours = diffMs / (1000 * 60 * 60);
    const remainingHours = 48 - diffHours;
    if (remainingHours <= 0) {
      return { text: 'Action Needed', color: 'text-red-600' };
    } else {
      const hours = Math.floor(remainingHours);
      const minutes = Math.floor((remainingHours - hours) * 60);
      return { text: `${hours}h ${minutes}m remaining`, color: 'text-gray-600' };
    }
  };
  const reviewTimeStatus = getReviewTimeStatus();



  const ValidationPanel = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${validationResults.isEligible ? 'bg-green-100' : 'bg-orange-100'
            }`}>
            <CheckCheck className={`w-4 h-4 ${validationResults.isEligible ? 'text-green-600' : 'text-orange-600'
              }`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Eligibility Check</h3>
            <p className="text-sm text-gray-600">
              {validationResults.isEligible ? 'All requirements met' : 'Some requirements missing'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className={`text-2xl font-bold ${validationResults.isEligible ? 'text-green-600' : 'text-orange-600'
            }`}>
            {Math.round(validationResults.requiredScore)}%
          </div>
          <div className="text-sm text-gray-500">Required Criteria</div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">Required Checks</span>
            <span>{validationResults.passedRequired}/{validationResults.totalRequired}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${validationResults.requiredScore === 100 ? 'bg-green-500' : 'bg-orange-500'
                }`}
              style={{ width: `${validationResults.requiredScore}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">Optional Checks</span>
            <span>{validationResults.passedOptional}/{validationResults.totalOptional}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(validationResults.passedOptional / validationResults.totalOptional) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Validation Checks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {validationChecks.map((check, index) => (
          <motion.div
            key={check.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center gap-3 p-3 rounded-lg border ${check.status
              ? 'bg-green-50 border-green-200'
              : check.required
                ? 'bg-red-50 border-red-200'
                : 'bg-gray-50 border-gray-200'
              }`}
          >
            <div className={`p-1 rounded ${check.status
              ? 'bg-green-100 text-green-600'
              : check.required
                ? 'bg-red-100 text-red-600'
                : 'bg-gray-100 text-gray-600'
              }`}>
              {check.status ? <CheckCheck className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800">{check.label}</div>
              <div className="text-xs text-gray-600">{check.description}</div>
            </div>
            <div className={`text-xs font-medium ${check.required ? 'text-red-600' : 'text-gray-500'
              }`}>
              {check.required ? 'Required' : 'Optional'}
            </div>
          </motion.div>
        ))}
      </div>

      {!validationResults.isEligible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg"
        >
          <div className="flex items-center gap-2 text-orange-800">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Action Required</span>
          </div>
          <p className="text-sm text-orange-700 mt-1">
            Seller must complete all required checks before approval.
            {validationResults.passedRequired < validationResults.totalRequired &&
              ` Missing ${validationResults.totalRequired - validationResults.passedRequired} required criteria.`
            }
          </p>
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-5000"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 z-5001 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="relative p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Seller Application Review
                      </h2>
                      <p className="text-gray-600">Review seller details and eligibility</p>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Status Badge */}
                <div className="absolute top-6 right-20">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${getStatusColor(seller.approvalStatus)}`}>
                    {getStatusIcon(seller.approvalStatus)}
                    {seller.approvalStatus?.charAt(0).toUpperCase() + seller.approvalStatus?.slice(1)}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Validation Toggle */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Application Details</h3>
                  <button
                    onClick={() => setShowValidation(!showValidation)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showValidation
                      ? 'bg-blue-50 border-blue-200 text-blue-600'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    <CheckCheck className="w-4 h-4" />
                    {showValidation ? 'Hide Validation' : 'Show Validation'}
                  </button>
                </div>

                {showValidation && <ValidationPanel />}

                {/* Rest of your existing content remains the same */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Personal & Business Info */}
                  <div className="space-y-6">
                    {/* Profile Section */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Profile Information</h3>
                      </div>

                      <div className="space-y-4">
                        <InfoRow label="Seller Type" value={seller.seller_type} />
                        <InfoRow
                          label="Email"
                          value={seller.email}
                          icon={<Mail className="w-4 h-4" />}
                          verified={seller.email_verified || seller.isEmailVerified}
                        />
                        <InfoRow label="Phone" value={seller.phone} icon={<Phone className="w-4 h-4" />} />
                        <InfoRow label="KRA PIN" value={seller.kraPin || seller.profile?.kraPin} />
                      </div>
                    </motion.div>

                    {/* Business Section */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Store className="w-4 h-4 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Business Details</h3>
                      </div>

                      <div className="space-y-4">
                        <InfoRow label="Store Name" value={seller.storeName} />
                        <InfoRow label="Business Type" value={seller.businessType} />
                        <InfoRow label="Registration Number" value={seller.businessRegistrationNumber} />
                        <InfoRow label="Category" value={seller.category} />
                      </div>
                    </motion.div>

                    {/* Location Section */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <MapPin className="w-4 h-4 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Location</h3>
                      </div>

                      <div className="space-y-4">
                        <InfoRow label="Country" value={seller.country} />
                        <InfoRow label="County" value={seller.county || seller.profile?.county} />
                        <InfoRow label="City" value={seller.city || seller.profile?.city} />
                        <InfoRow label="Address" value={seller.address} />
                        <InfoRow label="ZIP Code" value={seller.zipCode} />
                      </div>
                    </motion.div>
                  </div>

                  {/* Right Column - Payment & Additional Info */}
                  <div className="space-y-6">
                    {/* Payment Information */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <CreditCard className="w-4 h-4 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Payment Information</h3>
                      </div>

                      <div className="space-y-4">
                        <InfoRow label="Preferred Method" value={seller.paymentMethod} />

                        {seller.paymentMethod === 'BANK' && (
                          <>
                            <InfoRow label="Bank Name" value={seller.bankName} />
                            <InfoRow label="Account Number" value={seller.accountNumber} />
                            <InfoRow label="Account Holder" value={seller.accountHolderName} />
                            <InfoRow label="Branch Code" value={seller.branchCode} />
                          </>
                        )}

                        {seller.paymentMethod === 'MPESA' && (
                          <>
                            <InfoRow label="M-Pesa Number" value={seller.mpesaNumber} />
                            <InfoRow label="Account Name" value={seller.mpesaName} />
                          </>
                        )}

                        {seller.paymentMethod === 'JENGA' && (
                          <>
                            <InfoRow label="Jenga Account" value={seller.jengaAccountNumber} />
                            <InfoRow label="Account Name" value={seller.jengaAccountName} />
                            <InfoRow label="Bank Code" value={seller.jengaBankCode} />
                          </>
                        )}

                        {seller.paymentMethod === 'PAYPAL' && (
                          <>
                            <InfoRow label="PayPal Email" value={seller.paypalEmail} />
                            <InfoRow label="Account Holder" value={seller.paypalAccountHolder} />
                          </>
                        )}
                      </div>
                    </motion.div>

                    {/* Policies & Social */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <Shield className="w-4 h-4 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Policies & Social</h3>
                      </div>

                      <div className="space-y-4">
                        <InfoRow label="Return Policy" value={seller.returnPolicy ? `${seller.returnPolicy} days` : 'Not set'} />
                        <InfoRow label="Store Policy" value={seller.storePolicy} />
                        <InfoRow label="Store Description" value={seller.storeDescription} />

                        <div className="flex items-center gap-4 pt-2">
                          {seller.website && (
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                              <Globe className="w-4 h-4" />
                              Website
                            </div>
                          )}
                          {seller.facebook && (
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                              <Globe className="w-4 h-4" />
                              Facebook
                            </div>
                          )}
                          {seller.instagram && (
                            <div className="flex items-center gap-2 text-sm text-pink-600">
                              <Globe className="w-4 h-4" />
                              Instagram
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Stats & Metadata */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <Star className="w-4 h-4 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Statistics</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <StatCard label="Total Sales" value={seller.sales || 0} />
                        <StatCard label="Total Ratings" value={seller.numRatings || 0} />
                        <StatCard label="Average Rating" value={seller.rating || 0} suffix="/5" />
                        <StatCard label="Application Date" value={new Date(seller.created_at).toLocaleDateString()} />
                        <StatCard
                          label="Review Time Left"
                          value={reviewTimeStatus.text}
                          suffix=""
                        />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              {(seller.approvalStatus === 'pending' || seller.approvalStatus === 'under_review') && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 border-t border-gray-100 bg-gray-50/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCheck className="w-4 h-4" />
                      <span>
                        {validationResults.isEligible ? 'All checks passed' :
                          `${validationResults.totalRequired - validationResults.passedRequired} required checks failed`}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => onReject(seller.id)}
                        disabled={loading}
                        className="px-6 py-3 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject Application
                      </button>

                      <button
                        onClick={() => {
                          validationResults.isEligible ? handleApproveWithValidation() : sendValidationReminder()
                        }}
                        disabled={sendingReviewIssues || loading || (!validationResults.isEligible && !showValidation)}
                        className={`px-6 py-3 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2 shadow-lg ${validationResults.isEligible
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/25'
                          : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-orange-500/25'
                          }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {validationResults.isEligible ? 'Approve Seller' : 'Review Issues'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Approved state actions */}
              {(seller.approvalStatus === 'approved') && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 border-t border-gray-100 bg-gray-50/50"
                >
                  <div className="flex items-center justify-end gap-4">
                    <button
                      onClick={() => onReject(seller.id)}
                      disabled={loading}
                      className="px-6 py-3 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Seller
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Rejected state actions */}
              {(seller.approvalStatus === 'rejected') && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 border-t border-gray-100 bg-gray-50/50"
                >
                  <div className="flex items-center justify-end gap-4">
                    <button
                      onClick={() => onApprove(seller.id)}
                      disabled={loading}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2 shadow-lg shadow-green-500/25"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve Seller
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Enhanced InfoRow with verification badge
const InfoRow = ({ label, value, icon, verified }) => (
  <div className="flex justify-between items-start">
    <div className="flex items-center gap-2 text-gray-600">
      {icon}
      <span className="font-medium">{label}:</span>
    </div>
    <div className="flex items-center gap-2">
      <span className={`text-gray-800 text-right ${!value ? 'text-gray-400 italic' : 'font-medium'}`}>
        {value || 'Not provided'}
      </span>
      {verified && (
        <div className="p-0.5 bg-green-100 rounded-full">
          <CheckCheck className="w-3 h-3 text-green-600" />
        </div>
      )}
    </div>
  </div>
);

const StatCard = ({ label, value, suffix }) => (
  <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-200">
    <div className="text-2xl font-bold text-gray-800 mb-1">
      {value}{suffix}
    </div>
    <div className="text-xs text-gray-600 uppercase tracking-wide">
      {label}
    </div>
  </div>
);

export default SellerModal;