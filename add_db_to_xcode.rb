require 'xcodeproj'

project_path = 'ios/Kelimatik.xcodeproj'
file_name = 'Kelimeler.db'
file_path = 'Kelimatik/Kelimeler.db'

# Open the project
project = Xcodeproj::Project.open(project_path)

# Find the group 'Kelimatik' (usually the main group has the same name as the target)
group = project.main_group.find_subpath(File.join('Kelimatik'), true)

# Check if file is already there to avoid duplicates (though grep said no)
unless group.find_file_by_path(file_name)
  file_ref = group.new_reference(file_name)
  
  # Add to the main target
  target = project.targets.first
  target.add_resources([file_ref])
  
  project.save
  puts "Successfully added #{file_name} to Xcode project."
else
  puts "#{file_name} already exists in the project."
end
