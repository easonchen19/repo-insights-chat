
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonProps } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface UploadButtonProps extends Omit<ButtonProps, 'onClick'> {
  variant?: "outline" | "hero";
  size?: "sm" | "default";
}

const UploadButton = ({ variant = "outline", size = "sm", ...props }: UploadButtonProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate('/analyzer');
  };


  return (
    <Button variant={variant} size={size} onClick={handleClick} {...props}>
      <Upload className="w-4 h-4 mr-2" />
      Upload
    </Button>
  );
};

export default UploadButton;
