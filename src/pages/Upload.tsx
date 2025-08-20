import FileUpload from "@/components/FileUpload";
import ProtectedRoute from "@/components/ProtectedRoute";

const Upload = () => {
  return (
    <ProtectedRoute>
      <FileUpload />
    </ProtectedRoute>
  );
};

export default Upload;