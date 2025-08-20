import ProjectsDashboard from "@/components/ProjectsDashboard";
import ProtectedRoute from "@/components/ProtectedRoute";

const Projects = () => {
  return (
    <ProtectedRoute>
      <ProjectsDashboard />
    </ProtectedRoute>
  );
};

export default Projects;