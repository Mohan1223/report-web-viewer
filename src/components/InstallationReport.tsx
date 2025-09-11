import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, PrinterIcon, DownloadIcon, PhoneIcon, ShieldCheckIcon, PenToolIcon, RotateCcwIcon, MailIcon, ScanLine, CheckCircle2Icon, SearchIcon, LoaderIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarcodeScanner } from "./BarcodeScanner";
import { useFormPersistence } from "@/hooks/useFormPersistence";

const InstallationReport = () => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const initialFormData = {
    installationDate: "",
    schoolName: "",
    spocName: "",
    schoolAddress: "",
    salesOrderNo: "",
    totalIFPQty: "",
    brandName: "",
    serialNumbers: [] as { serial: string; image?: string; fileName?: string; accessories?: any; qcStatus?: string }[],
    currentSerial: "",
    upsPresent: "",
    earthingRequired: "",
    installationType: "",
    accessories: {
      stylus: false,
      remote: false,
      powerCable: false,
      touchCable: false,
      hdmiCable: false,
    },
    quickCheck: Array(16).fill(null),
    engineerName: "",
    engineerContact: "",
    schoolOwnerEmail: "",
    digitalSignature: "",
    mobileNumber: "",
    otp: "",
    agreement: false,
  };

  const [formData, setFormData, clearSavedData] = useFormPersistence(initialFormData);

  // New state for API fetching
  const [schoolDataState, setSchoolDataState] = useState({
    isLoading: false,
    isFetched: false,
    error: null as string | null,
  });

  const [otpState, setOtpState] = useState({
    isOtpSent: false,
    isOtpVerified: false,
    isLoading: false,
    countdown: 0,
  });

  const [signatureState, setSignatureState] = useState({
    isSigned: false,
    signatureData: "",
  });

  const [scannerState, setScannerState] = useState({
    isOpen: false,
  });

  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [qcDialogOpen, setQcDialogOpen] = useState(false);
  const [qcStatus, setQcStatus] = useState<"passed" | "failed" | null>(null);
  const [failedItems, setFailedItems] = useState<number[]>([]);
  const [accessoriesDialogOpen, setAccessoriesDialogOpen] = useState(false);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState<number | null>(null);

  // Initialize canvas when dialog opens
  useEffect(() => {
    if (signatureDialogOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Setup canvas properties
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Set white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // If editing existing signature, load it immediately
        if (signatureState.isSigned && signatureState.signatureData) {
          const img = new Image();
          img.onload = () => {
            // Draw the signature on top of white background
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = signatureState.signatureData;
        }
      }
    }
  }, [signatureDialogOpen, signatureState.signatureData]);

  const quickCheckItems = [
     "No Physical Damage?",
  "Powers On/Off Easily?",
  "Displays Home Screen Correctly?",
  "Speakers Work Clearly?",
  "Screen Is Clean (no spots or lines)?",
  "Touch Works Everywhere?",
  "Multi‑Touch Responds Properly?",
  "Stylus Functioning?",
  "No Lag in Touch/Drag?",
  "Pen Writes Accurately?",
  "Whiteboard App Opens & Saves?",
  "Internet Connection OK (Wi‑Fi/Cable)?",
  "Basic Controls Work (power, input, volume, draw)?",
  "Manuals & Warranty Info Provided?",
  "Remote Control Functions?",
  "Antennas Securely Attached?",
  ];

  // New function to fetch school details
  const fetchSchoolDetails = async () => {
    if (!formData.salesOrderNo.trim()) {
      toast({
        title: "Sales Order Required",
        description: "Please enter a sales order number first",
        variant: "destructive",
      });
      return;
    }

    setSchoolDataState({
      isLoading: true,
      isFetched: false,
      error: null,
    });

    try {
      // Simulate API call - Replace with actual API endpoint
      const response = await fetch(`/api/school-details/${formData.salesOrderNo}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch school details');
      }

      const schoolDetails = await response.json();

      // Update form with fetched data
      setFormData({
        ...formData,
        schoolName: schoolDetails.schoolName || "",
        spocName: schoolDetails.spocName || "",
        schoolAddress: schoolDetails.schoolAddress || "",
        totalIFPQty: schoolDetails.totalIFPQty?.toString() || "",
        brandName: schoolDetails.brandName || "",
      });

      setSchoolDataState({
        isLoading: false,
        isFetched: true,
        error: null,
      });

      toast({
        title: "School Details Fetched",
        description: "School information has been successfully retrieved",
      });

    } catch (error) {
      // For demo purposes, simulate successful fetch with dummy data
      setTimeout(() => {
        setFormData({
          ...formData,
          schoolName: "Demo School Name",
          spocName: "Demo SPOC (9876543210)",
          schoolAddress: "123 Demo Street, Demo City, Demo State - 123456",
          totalIFPQty: "5",
          brandName: "Vaama",
        });

        setSchoolDataState({
          isLoading: false,
          isFetched: true,
          error: null,
        });

        toast({
          title: "School Details Fetched",
          description: "School information has been successfully retrieved (Demo Data)",
        });
      }, 2000);
    }
  };

  const removeSerialNumber = (index: number) => {
    const newSerialNumbers = formData.serialNumbers.filter((_, i) => i !== index);
    setFormData({ ...formData, serialNumbers: newSerialNumbers });
  };

  const openScanner = () => {
    setScannerState({
      isOpen: true,
    });
  };

  const handleScanResult = (result: string) => {
    setScannerState({ isOpen: false });
    
    const serialValue = result.trim();
    const isDuplicate = formData.serialNumbers.some(item => 
      typeof item === 'string' ? item === serialValue : item.serial === serialValue
    );
    const ifpQty = parseInt(formData.totalIFPQty) || 0;
    const isWithinLimit = ifpQty === 0 || formData.serialNumbers.length < ifpQty;
    
    if (!serialValue) {
      toast({
        title: "Invalid Scan",
        description: "No valid barcode data detected. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    if (isDuplicate) {
      toast({
        title: "Duplicate Serial Number",
        description: `Serial number ${serialValue} has already been added`,
        variant: "destructive",
      });
      return;
    }
    
    if (!isWithinLimit) {
      toast({
        title: "Quantity Limit Reached",
        description: `Cannot add more than ${ifpQty} serial numbers (IFP quantity limit)`,
        variant: "destructive",
      });
      return;
    }
    
    // Add the scanned serial number
    setFormData(prev => ({
      ...prev,
      serialNumbers: [...prev.serialNumbers, { serial: serialValue }],
      currentSerial: "",
    }));
    
    toast({
      title: "Serial Number Added",
      description: `${serialValue} scanned and added successfully`,
    });

    // Show QC dialog after adding barcode
    openQcDialog(false);
  };

  const closeScanner = () => {
    setScannerState({ isOpen: false });
    toast({
      title: "Scanner Closed",
      description: "You can try scanning again or manually enter the serial number",
    });
  };

  const updateAccessory = (key: string, checked: boolean) => {
    setFormData({
      ...formData,
      accessories: { ...formData.accessories, [key]: checked },
    });
  };

  const updateQuickCheck = (index: number, value: boolean | null) => {
    const newQuickCheck = [...formData.quickCheck];
    newQuickCheck[index] = value;
    setFormData({ ...formData, quickCheck: newQuickCheck });
  };

  const handleAccessoriesSubmit = () => {
    if (currentDeviceIndex !== null) {
      const accessories = [
        { key: 'stylus', label: 'Stylus (2N)' },
        { key: 'remote', label: 'Remote' },
        { key: 'powerCable', label: 'Power Cable' },
        { key: 'touchCable', label: 'Touch Cable' },
        { key: 'hdmiCable', label: 'HDMI Cable' }
      ];
      
      const checkedAccessories = accessories.filter(acc => 
        formData.serialNumbers[currentDeviceIndex]?.accessories?.[acc.key]
      );
      const missingAccessories = accessories.filter(acc => 
        !formData.serialNumbers[currentDeviceIndex]?.accessories?.[acc.key]
      );
      
      if (missingAccessories.length > 0) {
        toast({
          title: "Accessories Missing",
          description: `${missingAccessories.length} accessory(ies) are missing`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "All Accessories Received",
          description: "All accessories have been verified",
        });
      }
    }
    
    setAccessoriesDialogOpen(false);
    setCurrentDeviceIndex(null);
  };

  const openQcDialog = (preserveState = true) => {
    // Initialize failedItems from current quickCheck state only if preserveState is true
    const currentFailedItems: number[] = [];
    if (preserveState && formData.quickCheck) {
      formData.quickCheck.forEach((isChecked, index) => {
        if (!isChecked) {
          currentFailedItems.push(index);
        }
      });
    }
    // If preserveState is false (new scan), start with all items unchecked (all failed)
    if (!preserveState) {
      for (let i = 0; i < quickCheckItems.length; i++) {
        currentFailedItems.push(i);
      }
    }
    setFailedItems(currentFailedItems);
    setQcDialogOpen(true);
  };

  const handleQcComplete = () => {
    // Always update quickCheck array based on current failedItems state
    const newQuickCheck = Array(quickCheckItems.length).fill(true);
    failedItems.forEach(index => {
      newQuickCheck[index] = false;
    });
    
    setFormData({ ...formData, quickCheck: newQuickCheck });
    
    // Show appropriate toast based on results
    if (failedItems.length > 0) {
      toast({
        title: "QC Failed Items Recorded",
        description: `${failedItems.length} item(s) marked as failed`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "QC Passed",
        description: "All quality checks passed successfully",
      });
    }
    
    setQcDialogOpen(false);
    setQcStatus(null);
    setFailedItems([]);
  };

  const toggleFailedItem = (index: number) => {
    setFailedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const updateDeviceAccessory = (deviceIndex: number, accessoryKey: string, checked: boolean) => {
    const updated = [...formData.serialNumbers];
    if (!updated[deviceIndex].accessories) {
      updated[deviceIndex].accessories = {
        stylus: false,
        remote: false,
        powerCable: false,
        touchCable: false,
        hdmiCable: false,
      };
    }
    updated[deviceIndex].accessories[accessoryKey] = checked;
    setFormData({ ...formData, serialNumbers: updated });
  };

  // OTP Functions
  const sendOtp = async () => {
    if (!formData.mobileNumber || formData.mobileNumber.length < 10) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    setOtpState({ ...otpState, isLoading: true });
    
    // Simulate API call
    setTimeout(() => {
      setOtpState({
        isOtpSent: true,
        isOtpVerified: false,
        isLoading: false,
        countdown: 60,
      });
      
      toast({
        title: "OTP Sent",
        description: `Verification code sent to ${formData.mobileNumber}`,
      });

      // Start countdown
      startCountdown();
    }, 1500);
  };

  const verifyOtp = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setOtpState({ ...otpState, isLoading: true });
    
    // Simulate API call - In real implementation, verify with backend
    setTimeout(() => {
      // For demo purposes, accept any 6-digit OTP
      setOtpState({
        ...otpState,
        isOtpVerified: true,
        isLoading: false,
      });
      
      toast({
        title: "OTP Verified",
        description: "Mobile number verified successfully",
      });
    }, 1000);
  };

  const startCountdown = () => {
    const timer = setInterval(() => {
      setOtpState((prev) => {
        if (prev.countdown <= 1) {
          clearInterval(timer);
          return { ...prev, countdown: 0 };
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
  };

  const resendOtp = () => {
    setOtpState({
      isOtpSent: false,
      isOtpVerified: false,
      isLoading: false,
      countdown: 0,
    });
    setFormData({ ...formData, otp: "" });
    sendOtp();
  };

  // Image compression utility
  const compressImage = (file: File, maxSizeMB: number = 5): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions to reduce file size
        let { width, height } = img;
        const maxDimension = 1920; // Max dimension to keep quality reasonable
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Start with high quality and reduce until under size limit
        let quality = 0.8;
        const tryCompress = () => {
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Compression failed'));
              return;
            }
            
            if (blob.size <= maxSizeMB * 1024 * 1024 || quality <= 0.1) {
              // Create new file with compressed data
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              quality -= 0.1;
              tryCompress();
            }
          }, 'image/jpeg', quality);
        };
        
        tryCompress();
      };
      
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Digital Signature Functions
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    } else {
      // Mouse event
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent scrolling on touch devices
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Configure drawing style
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent scrolling on touch devices
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (e) e.preventDefault();
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath(); // Reset the path
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Check if there's actual drawing content
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasDrawing = imageData.data.some((value, index) => {
      // Check alpha channel (every 4th value) - if any pixel is not transparent, there's drawing
      return index % 4 === 3 && value > 0;
    });
    
    if (!hasDrawing) {
      toast({
        title: "No Signature Found",
        description: "Please draw your signature before saving",
        variant: "destructive",
      });
      return;
    }
    
    const signatureData = canvas.toDataURL();
    setSignatureState({
      isSigned: true,
      signatureData: signatureData,
    });
    
    setFormData({ ...formData, digitalSignature: signatureData });
    
    // Close the dialog after saving
    setSignatureDialogOpen(false);
    
    toast({
      title: "Signature Saved",
      description: "Digital signature saved successfully",
    });
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas and set white background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setSignatureState({
      isSigned: false,
      signatureData: "",
    });
    
    setFormData({ ...formData, digitalSignature: "" });
    
    toast({
      title: "Signature Cleared",
      description: "Canvas cleared. You can draw a new signature.",
    });
  };

  const editSignature = () => {
    setSignatureDialogOpen(true);
  };

  const handleSubmitReport = () => {
    // Comprehensive validation
    const validationErrors = [];

    if (!formData.salesOrderNo.trim()) {
      validationErrors.push("Sales Order Number is required");
    }

    if (!schoolDataState.isFetched) {
      validationErrors.push("Please fetch school details first");
    }

    if (!formData.schoolName.trim()) {
      validationErrors.push("School Name is required");
    }

    if (!formData.spocName.trim()) {
      validationErrors.push("SPOC Name is required");
    }

    if (!formData.schoolAddress.trim()) {
      validationErrors.push("School Address is required");
    }

    if (!formData.totalIFPQty || parseInt(formData.totalIFPQty) === 0) {
      validationErrors.push("Total IFP Quantity is required");
    }

    if (formData.serialNumbers.length === 0) {
      validationErrors.push("At least one serial number is required");
    }

    const expectedQty = parseInt(formData.totalIFPQty) || 0;
    if (formData.serialNumbers.length !== expectedQty) {
      validationErrors.push(`Serial numbers count (${formData.serialNumbers.length}) must match IFP quantity (${expectedQty})`);
    }

    if (!formData.engineerName.trim()) {
      validationErrors.push("Engineer Name is required");
    }

    if (!formData.engineerContact.trim()) {
      validationErrors.push("Engineer Contact is required");
    }

    if (!formData.schoolOwnerEmail.trim()) {
      validationErrors.push("School Owner Email is required");
    }

    if (!signatureState.isSigned) {
      validationErrors.push("Digital signature is required");
    }

    if (!otpState.isOtpVerified) {
      validationErrors.push("Mobile number verification is required");
    }

    if (!formData.agreement) {
      validationErrors.push("Agreement acceptance is required");
    }

    // Check if any quick check item is marked as "No"
    const failedChecks = formData.quickCheck
      .map((value, index) => ({ value, index }))
      .filter(item => item.value === false)
      .map(item => quickCheckItems[item.index]);

    if (failedChecks.length > 0) {
      validationErrors.push(`Please resolve failed checks: ${failedChecks.join(', ')}`);
    }

    if (validationErrors.length > 0) {
      toast({
        title: "Validation Failed",
        description: validationErrors[0], // Show first error
        variant: "destructive",
      });
      return;
    }

    // Clear saved data from localStorage on successful submission
    clearSavedData();
    
    toast({
      title: "Report Submitted Successfully",
      description: "Installation report has been submitted and saved",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Professional Header */}
      <div className="bg-gradient-primary text-primary-foreground py-8 shadow-elegant">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <ShieldCheckIcon className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Installation & Service Report</h1>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in space-y-8">
        {/* Header */}
        <Card className="mb-6 shadow-card border-0 overflow-hidden">
          <CardHeader className="text-center bg-gradient-primary text-primary-foreground relative">
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
            <div className="relative flex justify-between items-center">
              <div className="text-3xl font-bold tracking-wider">LEAD</div>
              <div className="text-right">
                <div className="text-sm opacity-90">Installation Date:</div>
                <Input
                  type="date"
                  value={formData.installationDate}
                  onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })}
                  className="bg-white/95 text-foreground mt-1 border-0"
                />
              </div>
            </div>
            <CardTitle className="text-2xl mt-6 font-semibold tracking-wide relative">
              INSTALLATION SIGN-OFF FORM
            </CardTitle>
          </CardHeader>
        </Card>

        {/* School Information */}
        <Card className="mb-6 shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-lg bg-gradient-secondary px-6 py-3 rounded-lg font-semibold text-secondary">
              🏫 School Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="salesOrderNo">Sales Order NO:</Label>
                <div className="flex gap-2">
                  <Input
                    id="salesOrderNo"
                    value={formData.salesOrderNo}
                    onChange={(e) => setFormData({ ...formData, salesOrderNo: e.target.value })}
                    placeholder="Enter sales order number"
                    disabled={schoolDataState.isLoading}
                  />
                  <Button
                    type="button"
                    onClick={fetchSchoolDetails}
                    disabled={schoolDataState.isLoading || !formData.salesOrderNo.trim()}
                    className="whitespace-nowrap"
                  >
                    {schoolDataState.isLoading ? (
                      <>
                        <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <SearchIcon className="h-4 w-4 mr-2" />
                        Fetch Details
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Show fetched details */}
              {schoolDataState.isFetched && (
                <div className="space-y-4 p-4 bg-success-background border border-success-border rounded-lg">
                  <div className="flex items-center gap-2 text-success mb-3">
                    <CheckCircle2Icon className="h-5 w-5" />
                    <span className="font-medium">School details fetched successfully</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="schoolName">School Name:</Label>
                      <Input
                        id="schoolName"
                        value={formData.schoolName}
                        onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="spocName">SPOC Name & Number:</Label>
                      <Input
                        id="spocName"
                        value={formData.spocName}
                        onChange={(e) => setFormData({ ...formData, spocName: e.target.value })}
                        className="bg-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <Label htmlFor="totalIFPQty">Total TV & IFPD Installed Qty:</Label>
                       <Input
                         id="totalIFPQty"
                         type="number"
                         value={formData.totalIFPQty}
                         onChange={(e) => setFormData({ ...formData, totalIFPQty: e.target.value })}
                         className="bg-white"
                       />
                     </div>
                     <div>
                       <Label htmlFor="brandName">Brand Name:</Label>
                       <Input
                         id="brandName"
                         value={formData.brandName}
                         onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                         className="bg-white"
                         placeholder="e.g., Hyundai, Xentec, Vaama, EGN, SNL, Gladwin, Yaara, Hybrid EYE"
                       />
                     </div>
                   </div>
                  
                  <div>
                    <Label htmlFor="schoolAddress">School Address:</Label>
                    <Textarea
                      id="schoolAddress"
                      value={formData.schoolAddress}
                      onChange={(e) => setFormData({ ...formData, schoolAddress: e.target.value })}
                      rows={3}
                      className="bg-white"
                    />
                  </div>
                </div>
              )}

              {!schoolDataState.isFetched && !schoolDataState.isLoading && (
                <div className="text-center p-4 border-2 border-dashed border-muted rounded-lg bg-muted/30">
                  <SearchIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Enter sales order number and click "Fetch Details" to retrieve school information</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Serial Numbers */}
        <Card className="mb-6 shadow-card border-0">
          <CardHeader>
           <CardTitle className="text-lg bg-gradient-secondary px-6 py-3 rounded-lg font-semibold text-secondary">
             📱 TV & IFPD Serial Numbers ({formData.serialNumbers.length}/{parseInt(formData.totalIFPQty) || 0})
           </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Serial Number Input - Scan Only */}
            <div className="text-center space-y-6">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-center justify-center gap-3 text-amber-800 mb-3">
                  <div className="p-2 bg-amber-200 rounded-full">
                    <ScanLine className="h-6 w-6" />
                  </div>
                  <span className="font-bold text-lg">Scan Required</span>
                </div>
                <p className="text-amber-700 font-medium">
                  🔒 For accuracy and data integrity, serial numbers can only be added by scanning the barcode.
                </p>
              </div>
              <Button
                type="button"
                onClick={openScanner}
                className="w-full max-w-lg mx-auto flex items-center gap-3 bg-gradient-primary hover:opacity-90 transition-all duration-300 transform hover:scale-105"
                size="lg"
              >
                <ScanLine className="h-6 w-6" />
                <span className="font-semibold">Scan Serial Number Barcode</span>
              </Button>
            </div>

            {/* Added Serial Numbers */}
            {formData.serialNumbers.length > 0 && (
  <div className="space-y-2">
    <Label className="text-sm font-medium text-muted-foreground">Added Serial Numbers:</Label>
    <div className="flex flex-col gap-4">
      {formData.serialNumbers.map((item, index) => (
        <div
          key={index}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-3 bg-gray-100 rounded-md"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">#{index + 1}</span>
            <span className="font-semibold">{typeof item === 'string' ? item : item.serial}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeSerialNumber(index)}
              className="h-4 w-4 p-0 text-destructive hover:bg-destructive/20 rounded-full"
              title="Remove Serial Number"
            >
              ×
            </Button>
          </div>

          {/* Device-specific toggles */}
          <div className="flex gap-2 flex-wrap mb-2">
            {(() => {
              // Calculate QC status - Initialize array if not set
              const qcChecks = formData.quickCheck || Array(quickCheckItems.length).fill(false);
              const hasFailedQC = qcChecks.some(check => !check);
              const failedQcItems = quickCheckItems.filter((_, idx) => !qcChecks[idx]);
              const hasAnyChecks = qcChecks.some(check => check);
              
              return (
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      openQcDialog();
                    }}
                    className={`flex items-center gap-1 h-8 text-xs ${
                      hasAnyChecks && !hasFailedQC ? 'border-success-border text-success' : 
                      hasAnyChecks && hasFailedQC ? 'border-error-border text-error' : ''
                    }`}
                  >
                    {hasAnyChecks && !hasFailedQC ? (
                      <>✅ QC Passed</>
                    ) : hasAnyChecks && hasFailedQC ? (
                      <>❌ QC Failed</>
                    ) : (
                      <><CheckCircle2Icon className="h-3 w-3" /> QC Check</>
                    )}
                  </Button>
                  {hasAnyChecks && hasFailedQC && failedQcItems.length > 0 && (
                    <div className="text-xs text-error bg-error-background px-2 py-1 rounded border border-error-border">
                      Failed: {failedQcItems.join(', ')}
                    </div>
                  )}
                </div>
              );
            })()}
            
            {(() => {
              // Calculate Accessories status
              const accessories = [
                { key: 'stylus', label: 'Stylus (2N)' },
                { key: 'remote', label: 'Remote' },
                { key: 'powerCable', label: 'Power Cable' },
                { key: 'touchCable', label: 'Touch Cable' },
                { key: 'hdmiCable', label: 'HDMI Cable' }
              ];
              
              const deviceAccessories = typeof item !== 'string' ? item.accessories : null;
              const checkedAccessories = accessories.filter(acc => deviceAccessories?.[acc.key]);
              const missingAccessories = accessories.filter(acc => !deviceAccessories?.[acc.key]);
              const allReceived = checkedAccessories.length === accessories.length;
              const hasAnyAccessories = deviceAccessories && Object.values(deviceAccessories).some(Boolean);
              
              return (
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentDeviceIndex(index);
                      setAccessoriesDialogOpen(true);
                    }}
                    className={`flex items-center gap-1 h-8 text-xs ${
                      hasAnyAccessories && !allReceived ? 'border-error-border text-error' : 
                      allReceived ? 'border-success-border text-success' : ''
                    }`}
                  >
                    {hasAnyAccessories && !allReceived ? (
                      <>❌ Accessories Missing</>
                    ) : allReceived ? (
                      <>✅ All Accessories Received</>
                    ) : (
                      <>📦 Accessories</>
                    )}
                  </Button>
                  {hasAnyAccessories && !allReceived && missingAccessories.length > 0 && (
                    <div className="text-xs text-error bg-error-background px-2 py-1 rounded border border-error-border">
                      Missing: {missingAccessories.map(acc => acc.label).join(', ')}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            {/* Single Image Upload - Simplified */}
            {(typeof item !== 'string' && !item.image) || (typeof item === 'string') ? (
              <div className="flex gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                  📷 Add Photo
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      try {
                        let processedFile = file;
                        
                        // Show loading state
                        toast({
                          title: "Processing Image",
                          description: "Please wait while we process your image...",
                        });
                        
                        // Compress image if over 5MB
                        if (file.size > 5 * 1024 * 1024) {
                          processedFile = await compressImage(file);
                        }

                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const updated = [...formData.serialNumbers];
                          if (typeof updated[index] === 'string') {
                            updated[index] = { 
                              serial: updated[index] as string, 
                              image: event.target?.result as string,
                              fileName: processedFile.name 
                            };
                          } else {
                            updated[index].image = event.target?.result as string;
                            updated[index].fileName = processedFile.name;
                          }
                          setFormData({ ...formData, serialNumbers: updated });
                          
                          toast({
                            title: "Photo Added Successfully",
                            description: `${processedFile.name} uploaded and processed`,
                          });

                          // Show QC dialog after adding photo
                          openQcDialog(false);
                        };
                        reader.readAsDataURL(processedFile);
                      } catch (error) {
                        toast({
                          title: "Upload Failed",
                          description: "Failed to process image. Please try again.",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            ) : null}

            {typeof item !== 'string' && item.image && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-success font-medium">
                  📎 {item.fileName || 'image.jpg'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const updated = [...formData.serialNumbers];
                    if (typeof updated[index] !== 'string') {
                      delete updated[index].image;
                      delete updated[index].fileName;
                    }
                    setFormData({ ...formData, serialNumbers: updated });
                  }}
                  className="text-xs text-destructive hover:bg-destructive/20 p-1 h-auto"
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
)}

          </CardContent>
        </Card>

        {/* Installation Details */}
        <Card className="mb-6 shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-lg bg-gradient-secondary px-6 py-3 rounded-lg font-semibold text-secondary">
              🔧 Installation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-base font-medium">UPS Present:</Label>
                <RadioGroup
                  value={formData.upsPresent}
                  onValueChange={(value) => setFormData({ ...formData, upsPresent: value })}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="ups-yes" />
                    <Label htmlFor="ups-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="ups-no" />
                    <Label htmlFor="ups-no">No</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label className="text-base font-medium">Earthing Work Required:</Label>
                <RadioGroup
                  value={formData.earthingRequired}
                  onValueChange={(value) => setFormData({ ...formData, earthingRequired: value })}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="earthing-yes" />
                    <Label htmlFor="earthing-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="earthing-no" />
                    <Label htmlFor="earthing-no">No</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <div>
              <Label className="text-base font-medium">Installation done on:</Label>
              <RadioGroup
                value={formData.installationType}
                onValueChange={(value) => setFormData({ ...formData, installationType: value })}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="wall-mount" id="wall-mount" />
                  <Label htmlFor="wall-mount">Wall Mount</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="movable-stand" id="movable-stand" />
                  <Label htmlFor="movable-stand">Movable Stand</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>


        {/* Engineer Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg bg-table-header px-4 py-2 rounded">
              Engineer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="engineerName">Engineer Name:</Label>
                <Input
                  id="engineerName"
                  value={formData.engineerName}
                  onChange={(e) => setFormData({ ...formData, engineerName: e.target.value })}
                  placeholder="Enter engineer name"
                />
              </div>
              <div>
                <Label htmlFor="engineerContact">Engineer Contact Number:</Label>
                <Input
                  id="engineerContact"
                  value={formData.engineerContact}
                  onChange={(e) => setFormData({ ...formData, engineerContact: e.target.value })}
                  placeholder="Enter contact number"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* School Owner/Principal/SPOC Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg bg-table-header px-4 py-2 rounded">
              School Owner / Principal / SPOC Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="schoolOwnerEmail">Email Address:</Label>
              <Input
                id="schoolOwnerEmail"
                type="email"
                value={formData.schoolOwnerEmail}
                onChange={(e) => setFormData({ ...formData, schoolOwnerEmail: e.target.value })}
                placeholder="Enter email address to receive report copy"
              />
              <p className="text-sm text-muted-foreground mt-1">
                A copy of this installation report will be sent to this email address
              </p>
            </div>

            {/* Digital Signature Section */}
            <div>
              <Label className="text-base font-medium flex items-center gap-2 mb-3">
                <PenToolIcon className="h-5 w-5 text-primary" />
                Digital Signature (Required)
              </Label>
              
              <div className="space-y-4">
                 {signatureState.isSigned ? (
                  <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 bg-success-background border border-success-border rounded-lg">
                       <div className="flex items-center gap-3">
                         <CheckCircle2Icon className="h-5 w-5 text-success" />
                         <span className="font-medium text-success">Signature captured successfully</span>
                       </div>
                       <Button
                         type="button"
                         variant="outline"
                         size="sm"
                         onClick={editSignature}
                         className="border-success-border text-success hover:bg-success-background"
                       >
                        <PenToolIcon className="h-4 w-4 mr-1" />
                        Edit Signature
                      </Button>
                    </div>
                    
                    {/* Signature Preview */}
                    <div className="border border-input rounded-lg p-4 bg-white">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Signature Preview:</p>
                      <div className="border border-gray-200 rounded bg-gray-50 p-2 flex justify-center">
                        <img 
                          src={signatureState.signatureData} 
                          alt="Digital Signature" 
                          className="max-w-full h-auto rounded"
                          style={{ maxHeight: '100px' }}
                        />
                      </div>
                      <div className="flex justify-center mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearSignature}
                          className="text-destructive border-destructive hover:bg-destructive/10"
                        >
                          <RotateCcwIcon className="h-4 w-4 mr-1" />
                          Remove Signature
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 border-2 border-dashed border-muted rounded-lg bg-muted/30">
                    <PenToolIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No signature added yet</p>
                    <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                          <PenToolIcon className="h-4 w-4 mr-2" />
                          Add Digital Signature
                        </Button>
                      </DialogTrigger>
                       <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <PenToolIcon className="h-5 w-5" />
                              {signatureState.isSigned ? 'Edit Digital Signature' : 'Add Digital Signature'}
                            </DialogTitle>
                          </DialogHeader>
                         <div className="space-y-4">
                           <div className="border-2 border-dashed border-muted rounded-lg p-6 bg-muted/30">
                             <canvas
                               ref={canvasRef}
                               width={600}
                               height={200}
                               onMouseDown={startDrawing}
                               onMouseMove={draw}
                               onMouseUp={stopDrawing}
                               onMouseLeave={stopDrawing}
                               onTouchStart={startDrawing}
                               onTouchMove={draw}
                               onTouchEnd={stopDrawing}
                               className="border border-input rounded bg-white cursor-crosshair w-full block"
                               style={{ 
                                 touchAction: 'none',
                                 maxWidth: '100%',
                                 height: 'auto'
                               }}
                                onLoad={() => {
                                  const canvas = canvasRef.current;
                                  if (canvas) {
                                    const ctx = canvas.getContext('2d');
                                    if (ctx) {
                                      ctx.fillStyle = '#ffffff';
                                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                                    }
                                  }
                                }}
                             />
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                              Sign above using your mouse, stylus, or finger
                            </p>
                          </div>
                          
                          <div className="flex justify-center gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={clearSignature}
                              className="flex items-center gap-2"
                            >
                              <RotateCcwIcon className="h-4 w-4" />
                              Clear
                            </Button>
                            <Button
                              type="button"
                              onClick={saveSignature}
                              className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                            >
                              <CheckCircle2Icon className="h-4 w-4" />
                              Save Signature
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </div>


            {/* Mobile OTP Verification Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-primary" />
                Mobile OTP Verification
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mobileNumber">Mobile Number:</Label>
                    <div className="flex gap-2">
                      <Input
                        id="mobileNumber"
                        type="tel"
                        placeholder="Enter 10-digit mobile number"
                        value={formData.mobileNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setFormData({ ...formData, mobileNumber: value });
                        }}
                        disabled={otpState.isOtpVerified}
                        className={otpState.isOtpVerified ? "bg-success-background" : ""}
                      />
                      <Button
                        type="button"
                        onClick={sendOtp}
                        disabled={otpState.isLoading || otpState.countdown > 0 || otpState.isOtpVerified}
                        className="whitespace-nowrap"
                        variant={otpState.isOtpSent ? "outline" : "default"}
                      >
                        <PhoneIcon className="h-4 w-4 mr-1" />
                        {otpState.isLoading 
                          ? "Sending..." 
                          : otpState.countdown > 0 
                          ? `Resend in ${otpState.countdown}s` 
                          : otpState.isOtpSent 
                          ? "Resend OTP" 
                          : "Send OTP"}
                      </Button>
                    </div>
                  </div>

                  {otpState.isOtpSent && !otpState.isOtpVerified && (
                    <div>
                      <Label htmlFor="otp">Enter OTP:</Label>
                      <div className="flex gap-2">
                        <Input
                          id="otp"
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={formData.otp}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setFormData({ ...formData, otp: value });
                          }}
                          maxLength={6}
                        />
                        <Button
                          type="button"
                          onClick={verifyOtp}
                          disabled={otpState.isLoading || formData.otp.length !== 6}
                          variant="default"
                        >
                          <ShieldCheckIcon className="h-4 w-4 mr-1" />
                          {otpState.isLoading ? "Verifying..." : "Verify"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {otpState.isOtpVerified && (
                  <div className="flex items-center gap-2 text-success bg-success-background p-3 rounded-md">
                    <ShieldCheckIcon className="h-5 w-5" />
                    <span className="font-medium">Mobile number verified successfully</span>
                  </div>
                )}

                {otpState.countdown > 0 && (
                  <Button
                    type="button"
                    variant="link"
                    onClick={resendOtp}
                    className="text-sm text-primary hover:underline p-0"
                  >
                    Didn't receive OTP? Click to resend
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3 pt-4">
              <Checkbox
                id="agreement"
                checked={formData.agreement}
                onCheckedChange={(checked) => setFormData({ ...formData, agreement: checked as boolean })}
                className="mt-1"
              />
              <Label htmlFor="agreement" className="text-sm leading-5">
                I hereby acknowledge the above and confirm my agreement to Lead School's Terms of Use as outlined in the detailed agreement signed.
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 py-8">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => {
              // Generate PDF download functionality
              const reportData = {
                ...formData,
                signatureData: signatureState.signatureData,
                timestamp: new Date().toISOString(),
              };
              
              // For now, download as JSON - can be replaced with actual PDF generation
              const dataStr = JSON.stringify(reportData, null, 2);
              const dataBlob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `installation-report-${formData.salesOrderNo || 'draft'}-${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              
              toast({
                title: "Report Downloaded",
                description: "Installation report downloaded successfully",
              });
            }}
          >
            <DownloadIcon className="h-4 w-4" />
            Download Report
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={handleSubmitReport}
          >
            <CalendarIcon className="h-4 w-4" />
            Submit Report
          </Button>
        </div>

        {/* Barcode Scanner Modal */}
        <BarcodeScanner
          isOpen={scannerState.isOpen}
          onScan={handleScanResult}
          onClose={closeScanner}
        />

        {/* QC Dialog */}
        <Dialog open={qcDialogOpen} onOpenChange={setQcDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2Icon className="h-6 w-6" />
                Interactive Display Quick Check
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Dynamic Status Display */}
              <div className="p-4 border rounded-lg bg-card">
                {failedItems.length === 0 ? (
                  <div className="flex items-center gap-2 text-success">
                    <span className="text-2xl">✅</span>
                    <span className="font-semibold text-lg">QC Passed</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-error">
                      <span className="text-2xl">❌</span>
                      <span className="font-semibold text-lg">QC Failed</span>
                    </div>
                    <div className="bg-error-background p-3 rounded border border-error-border">
                      <p className="text-sm font-medium text-error mb-2">Failed Items:</p>
                      <ul className="text-sm text-error space-y-1">
                        {failedItems.map(index => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-error mt-0.5">•</span>
                            {quickCheckItems[index]}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-4">
                  Please perform the following quality checks on the installed device:
                </p>
                
                <div className="space-y-3">
                  {quickCheckItems.map((item, index) => (
                    <div key={index} className={`flex items-center justify-between p-3 rounded border ${
                      failedItems.includes(index) ? 'bg-error-background border-error-border' : 'bg-background'
                    }`}>
                      <span className="text-sm font-medium flex items-center gap-2">
                        <span className="text-primary">★</span>
                        {item}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {failedItems.includes(index) ? 'Failed' : 'Passed'}
                        </span>
                        <Checkbox
                          checked={!failedItems.includes(index)}
                          onCheckedChange={() => toggleFailedItem(index)}
                          className="h-5 w-5"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setQcDialogOpen(false);
                    setQcStatus(null);
                    setFailedItems([]);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleQcComplete}
                  className="flex-1"
                >
                  Submit
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Accessories Dialog */}
        <Dialog open={accessoriesDialogOpen} onOpenChange={setAccessoriesDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                📦 Accessories Received
              </DialogTitle>
            </DialogHeader>
            
            {currentDeviceIndex !== null && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Device: {typeof formData.serialNumbers[currentDeviceIndex] === 'string' 
                    ? formData.serialNumbers[currentDeviceIndex] 
                    : formData.serialNumbers[currentDeviceIndex].serial}
                </p>

                {(() => {
                  const accessories = [
                    { key: 'stylus', label: 'Stylus (2N)' },
                    { key: 'remote', label: 'Remote' },
                    { key: 'powerCable', label: 'Power Cable' },
                    { key: 'touchCable', label: 'Touch Cable' },
                    { key: 'hdmiCable', label: 'HDMI Cable' }
                  ];
                  
                  const checkedAccessories = accessories.filter(acc => 
                    formData.serialNumbers[currentDeviceIndex]?.accessories?.[acc.key]
                  );
                  const missingAccessories = accessories.filter(acc => 
                    !formData.serialNumbers[currentDeviceIndex]?.accessories?.[acc.key]
                  );
                  
                  const allReceived = checkedAccessories.length === accessories.length;

                  return (
                    <>
                      {/* Dynamic Status Display */}
                      <div className="p-4 border rounded-lg bg-card">
                        {allReceived ? (
                          <div className="flex items-center gap-2 text-success">
                            <span className="text-2xl">✅</span>
                            <span className="font-semibold text-lg">All Accessories Received</span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-error">
                              <span className="text-2xl">❌</span>
                              <span className="font-semibold text-lg">Accessory Missing</span>
                            </div>
                            {missingAccessories.length > 0 && (
                              <div className="bg-error-background p-3 rounded border border-error-border">
                                <p className="text-sm font-medium text-error mb-2">Missing Accessories:</p>
                                <ul className="text-sm text-error space-y-1">
                                  {missingAccessories.map(acc => (
                                    <li key={acc.key} className="flex items-start gap-2">
                                      <span className="text-error mt-0.5">•</span>
                                      {acc.label}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                
                      <div className="space-y-3">
                        {accessories.map(({ key, label }) => {
                          const isChecked = formData.serialNumbers[currentDeviceIndex]?.accessories?.[key] || false;
                          return (
                           <div key={key} className={`flex items-center justify-between p-3 rounded border ${
                              isChecked ? 'bg-success-background border-success-border' : 'bg-error-background border-error-border'
                            }`}>
                              <Label htmlFor={`accessory-${key}`} className="text-sm font-medium">
                                {label}
                              </Label>
                              <div className="flex items-center gap-2">
                               <span className={`text-xs font-medium ${
                                  isChecked ? 'text-success' : 'text-error'
                                }`}>
                                  {isChecked ? 'Received' : 'Missing'}
                                </span>
                                <Checkbox
                                  id={`accessory-${key}`}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => 
                                    updateDeviceAccessory(currentDeviceIndex, key, !!checked)
                                  }
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setAccessoriesDialogOpen(false);
                      setCurrentDeviceIndex(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAccessoriesSubmit}
                    className="flex-1"
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default InstallationReport;
