require 'xcodeproj'

project_path = 'ios/Kelimatik.xcodeproj'

# Open the project
project = Xcodeproj::Project.open(project_path)

# Find the group 'Kelimatik'
kelimatik_group = project.main_group.find_subpath('Kelimatik', false)

if kelimatik_group.nil?
  puts "Error: Could not find Kelimatik group"
  exit 1
end

# Add Kelimeler.db directly to Kelimatik group (app bundle root)
file_ref = kelimatik_group.new_reference('Kelimeler.db')

# Add to the main target resources
target = project.targets.first
target.add_resources([file_ref])

puts "Added Kelimeler.db to Kelimatik group and Resources"

project.save
puts "Project saved successfully"
