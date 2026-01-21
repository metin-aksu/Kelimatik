require 'xcodeproj'

project_path = 'ios/Kelimatik.xcodeproj'

# Open the project
project = Xcodeproj::Project.open(project_path)

# Find all file references named Kelimeler.db
file_refs_to_remove = []
build_files_to_remove = []

project.objects.each do |obj|
  if obj.is_a?(Xcodeproj::Project::Object::PBXFileReference) && obj.path == 'Kelimeler.db'
    file_refs_to_remove << obj
  end
  if obj.is_a?(Xcodeproj::Project::Object::PBXBuildFile) && obj.file_ref && obj.file_ref.path == 'Kelimeler.db'
    build_files_to_remove << obj
  end
end

puts "Found #{file_refs_to_remove.count} file references to Kelimeler.db"
puts "Found #{build_files_to_remove.count} build files for Kelimeler.db"

# Remove build files first
build_files_to_remove.each do |bf|
  bf.remove_from_project
  puts "Removed build file"
end

# Remove file references
file_refs_to_remove.each do |fr|
  fr.remove_from_project
  puts "Removed file reference"
end

# Also check groups and remove 'www' group if it was created
project.main_group.recursive_children.each do |child|
  if child.is_a?(Xcodeproj::Project::Object::PBXGroup) && child.name == 'www'
    child.remove_from_project
    puts "Removed www group"
  end
end

project.save
puts "Project cleaned and saved"
