import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, PrinterIcon, DownloadIcon, PhoneIcon, ShieldCheckIcon, PenToolIcon, RotateCcwIcon, MailIcon, ScanLine } from "lucide-react";
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
    serialNumbers: [] as { serial: string; image?: string }[],
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
    quickCheck: Array(15).fill(false),
    engineerName: "",
    engineerContact: "",
    schoolOwnerEmail: "",
    digitalSignature: "",
    mobileNumber: "",
    otp: "",
    agreement: false,
  };

  const [formData, setFormData, clearSavedData] = useFormPersistence(initialFormData);

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

  const quickCheckItems = [
    "No Physical damage Screen, Frame, ports, and look perfect.",
    "Power On/Off: Powers up and down easily with its main button.",
    "Screen Correctly: Shows the right home screen without errors.",
    "Sound Works: Speakers are clear (play something!).",
    "Clean Screen: No spots, colored dots, or lines.",
    "Touch Works Everywhere: Touch and register accurately all over (corners, edges, center).",
    "Multi-Touch Works: Support for multi-finger touching, painting may vary.",
    "Stylus Works: Real pen & stylus work.",
    "Touch Feel Fast: No lag when touching or dragging.",
    "Pen Works: Writing pen works accurately with both ends.",
    "Whiteboard App Works: Built-in app opens, draws, saves, and loads correctly.",
    "Internet Connection: Shows WiFi as good or cable as online.",
    "Basic Swipe: User show how to turn on/off, change inputs, adjust volume, and draw.",
    "Paperwork Given: User manuals, warranty info, and contact details provided.",
    "Remote Works: Remote control functions properly.",
    "Antennas On: Wi-Fi antennas are securely attached."
  ];

  const addSerialNumber = () => {
    const serialValue = formData.currentSerial.trim();
    if (!serialValue) {
      toast({
        title: "Empty Serial Number",
        description: "Please enter a serial number",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.serialNumbers.some(item => 
      typeof item === 'string' ? item === serialValue : item.serial === serialValue
    )) {
      toast({
        title: "Duplicate Serial Number",
        description: "This serial number already exists",
        variant: "destructive",
      });
      return;
    }
    
    // Validate against IFP quantity
    const ifpQty = parseInt(formData.totalIFPQty) || 0;
    if (ifpQty > 0 && formData.serialNumbers.length >= ifpQty) {
      toast({
        title: "Quantity Limit Reached",
        description: `Cannot add more than ${ifpQty} serial numbers (IFP quantity limit)`,
        variant: "destructive",
      });
      return;
    }

    
    setFormData({
      ...formData,
      serialNumbers: [...formData.serialNumbers, { serial: serialValue }],
      currentSerial: "",
    });
    
    toast({
      title: "Serial Number Added",
      description: `Serial number ${serialValue} added successfully`,
    });
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
    setFormData({ ...formData, currentSerial: result });
    setScannerState({
      isOpen: false,
    });
    // Auto-add the scanned serial number
    setTimeout(() => {
      const serialValue = result.trim();
      const isDuplicate = formData.serialNumbers.some(item => 
        typeof item === 'string' ? item === serialValue : item.serial === serialValue
      );
      const ifpQty = parseInt(formData.totalIFPQty) || 0;
      const isWithinLimit = ifpQty === 0 || formData.serialNumbers.length < ifpQty;
      
      if (serialValue && !isDuplicate && isWithinLimit) {
        setFormData(prev => ({
          ...prev,
          serialNumbers: [...prev.serialNumbers, { serial: serialValue }],
          currentSerial: "",
        }));
        toast({
          title: "Serial Number Scanned & Added",
          description: `Serial number ${serialValue} scanned and added successfully`,
        });
      } else if (!isWithinLimit) {
        toast({
          title: "Quantity Limit Reached",
          description: `Cannot add more than ${ifpQty} serial numbers (IFP quantity limit)`,
          variant: "destructive",
        });
      }
    }, 100);
  };

  const closeScanner = () => {
    setScannerState({
      isOpen: false,
    });
  };


  const updateAccessory = (key: string, checked: boolean) => {
    setFormData({
      ...formData,
      accessories: { ...formData.accessories, [key]: checked },
    });
  };

  const updateQuickCheck = (index: number, checked: boolean) => {
    const newQuickCheck = [...formData.quickCheck];
    newQuickCheck[index] = checked;
    setFormData({ ...formData, quickCheck: newQuickCheck });
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

  // Digital Signature Functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const signatureData = canvas.toDataURL();
    setSignatureState({
      isSigned: true,
      signatureData: signatureData,
    });
    
    setFormData({ ...formData, digitalSignature: signatureData });
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureState({
      isSigned: false,
      signatureData: "",
    });
    
    setFormData({ ...formData, digitalSignature: "" });
  };

  const handleSubmitReport = () => {
    // Validate required fields
    if (!formData.agreement) {
      toast({
        title: "Agreement Required",
        description: "Please accept the agreement before submitting",
        variant: "destructive",
      });
      return;
    }

    if (!otpState.isOtpVerified) {
      toast({
        title: "OTP Verification Required",
        description: "Please verify your mobile number before submitting",
        variant: "destructive",
      });
      return;
    }

    // Clear saved data from localStorage on successful submission
    clearSavedData();
    
    toast({
      title: "Report Submitted",
      description: "Installation report submitted successfully",
    });
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="text-center bg-primary text-primary-foreground">
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">LEAD</div>
              <div className="text-right">
                <div className="text-sm">Installation Date:</div>
                <Input
                  type="date"
                  value={formData.installationDate}
                  onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })}
                  className="bg-white text-foreground mt-1"
                />
              </div>
            </div>
            <CardTitle className="text-xl mt-4">
              IFPD - INSTALLATION SIGN-OFF FORM
            </CardTitle>
          </CardHeader>
        </Card>

        {/* School Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg bg-table-header px-4 py-2 rounded">
              School Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="schoolName">School Name:</Label>
                <Input
                  id="schoolName"
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="spocName">SPOC Name & Number:</Label>
                <Input
                  id="spocName"
                  value={formData.spocName}
                  onChange={(e) => setFormData({ ...formData, spocName: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salesOrderNo">Sales Order NO:</Label>
                <Input
                  id="salesOrderNo"
                  value={formData.salesOrderNo}
                  onChange={(e) => setFormData({ ...formData, salesOrderNo: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="totalIFPQty">Total IFP Installed Qty:</Label>
                <Input
                  id="totalIFPQty"
                  type="number"
                  value={formData.totalIFPQty}
                  onChange={(e) => setFormData({ ...formData, totalIFPQty: e.target.value })}
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
              />
            </div>
          </CardContent>
        </Card>

        {/* Serial Numbers */}
        <Card className="mb-6">
          <CardHeader>
           <CardTitle className="text-lg bg-indigo-100 px-4 py-2 rounded">
            Interactive Flat Panel Device (IFPD) Serial Numbers ({formData.serialNumbers.length}/{parseInt(formData.totalIFPQty) || 0})
           </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Serial Number Input */}
            <div className="flex items-center gap-2">
              <Input
                value={formData.currentSerial}
                onChange={(e) => setFormData({ ...formData, currentSerial: e.target.value })}
                placeholder="Enter or scan serial number"
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSerialNumber();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openScanner}
                className="flex-shrink-0"
                title="Scan Barcode"
              >
                <ScanLine className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                onClick={addSerialNumber}
                disabled={
                  !formData.currentSerial.trim() ||
                  (parseInt(formData.totalIFPQty) > 0 && formData.serialNumbers.length >= parseInt(formData.totalIFPQty))
                }
                className="flex-shrink-0"
              >
                Add
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

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="file"
              accept="image/*,capture=camera"
              capture="environment"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                if (file.size > 5 * 1024 * 1024) {
                  toast({
                    title: "File Too Large",
                    description: "Please select an image smaller than 5MB",
                    variant: "destructive",
                  });
                  return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                  const updated = [...formData.serialNumbers];
                  if (typeof updated[index] === 'string') {
                    updated[index] = { serial: updated[index] as string, image: event.target?.result as string };
                  } else {
                    updated[index].image = event.target?.result as string;
                  }
                  setFormData({ ...formData, serialNumbers: updated });
                };
                reader.readAsDataURL(file);
              }}
              className="hidden"
              id={`camera-${index}`}
            />
            <label
              htmlFor={`camera-${index}`}
              className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              📷 {typeof item !== 'string' && item.image ? 'Change' : 'Add'} Photo
            </label>
            {typeof item !== 'string' && item.image && (
              <div className="flex flex-col items-center gap-1">
                <img
                  src={item.image}
                  alt="Installation"
                  className="w-16 h-16 object-cover rounded border"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const updated = [...formData.serialNumbers];
                    if (typeof updated[index] !== 'string') {
                      delete updated[index].image;
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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg bg-table-header px-4 py-2 rounded">
              Installation Details
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

        {/* Accessories */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg bg-table-header px-4 py-2 rounded">
              Accessories Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="stylus"
                  checked={formData.accessories.stylus}
                  onCheckedChange={(checked) => updateAccessory("stylus", checked as boolean)}
                />
                <Label htmlFor="stylus">Stylus (2N)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remote"
                  checked={formData.accessories.remote}
                  onCheckedChange={(checked) => updateAccessory("remote", checked as boolean)}
                />
                <Label htmlFor="remote">Remote</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="powerCable"
                  checked={formData.accessories.powerCable}
                  onCheckedChange={(checked) => updateAccessory("powerCable", checked as boolean)}
                />
                <Label htmlFor="powerCable">Power Cable</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="touchCable"
                  checked={formData.accessories.touchCable}
                  onCheckedChange={(checked) => updateAccessory("touchCable", checked as boolean)}
                />
                <Label htmlFor="touchCable">Touch Cable</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hdmiCable"
                  checked={formData.accessories.hdmiCable}
                  onCheckedChange={(checked) => updateAccessory("hdmiCable", checked as boolean)}
                />
                <Label htmlFor="hdmiCable">HDMI cable</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Check */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg bg-table-header px-4 py-2 rounded">
              Interactive Display Quick Check
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickCheckItems.map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Checkbox
                    id={`check-${index}`}
                    checked={formData.quickCheck[index]}
                    onCheckedChange={(checked) => updateQuickCheck(index, checked as boolean)}
                    className="mt-1"
                  />
                  <Label htmlFor={`check-${index}`} className="text-sm leading-5">
                    <span className="font-medium">{index + 1}.</span> {item}
                  </Label>
                </div>
              ))}
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
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="border border-gray-400 rounded bg-white cursor-crosshair w-full max-w-md mx-auto block"
                  style={{ touchAction: 'none' }}
                />
                
                <div className="flex justify-center gap-3 mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearSignature}
                    className="flex items-center gap-2"
                  >
                    <RotateCcwIcon className="h-4 w-4" />
                    Clear Signature
                  </Button>
                </div>
                
                {signatureState.isSigned && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded-md mt-3">
                    <PenToolIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">Signature captured successfully</span>
                  </div>
                )}
                
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Please sign above using your mouse or touch screen
                </p>
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
                        className={otpState.isOtpVerified ? "bg-green-50" : ""}
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
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
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
        <div className="flex justify-center gap-4 mb-8">
          <Button variant="outline" className="flex items-center gap-2">
            <PrinterIcon className="h-4 w-4" />
            Print Form
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <DownloadIcon className="h-4 w-4" />
            Download PDF
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
      </div>
    </div>
  );
};

export default InstallationReport;