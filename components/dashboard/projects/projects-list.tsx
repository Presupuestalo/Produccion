import type React from "react"

interface Project {
  id: string
  name: string
  description: string
}

interface ProjectsListProps {
  projects: Project[]
}

const ProjectsList: React.FC<ProjectsListProps> = ({ projects }) => {
  return (
    <div>
      {projects.length > 0 ? (
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <h3>{project.name}</h3>
              <p>{project.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No projects found.</p>
      )}
    </div>
  )
}

export default ProjectsList
