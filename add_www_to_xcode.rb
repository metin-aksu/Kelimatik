require 'xcodeproj'

project_path = 'ios/Kelimatik.xcodeproj'

# Open the project
project = Xcodeproj::Project.open(project_path)

# Create 'www' group at the project root level (not inside Kelimatik folder)
www_group = project.main_group.new_group('www', '../ios/www')
puts "Created www group"

# Add Kelimeler.db to www group
file_ref = www_group.new_reference('Kelimeler.db')

# Add to the main target resources
target = project.targets.first
target.add_resources([file_ref])

puts "Added Kelimeler.db to www group and Resources"

project.save
puts "Project saved successfully"
