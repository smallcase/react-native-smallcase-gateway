require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-smallcase-gateway"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.description  = <<-DESC
                  react-native-smallcase-gateway
                   DESC
  s.homepage     = "https://github.com/mobile/react-native-smallcase-gateway"
  # brief license entry:
  s.license      = "MIT"
  # optional - use expanded license entry instead:
  # s.license    = { :type => "MIT", :file => "LICENSE" }
  s.authors      = { "smallcase" => "mobile@smallcase.com" }
  s.platforms    = { :ios => "11.0" }
  # s.source       = { :git => "https://github.com/mobile/react-native-smallcase-gateway.git", :tag => "#{s.version}" }
  s.source       = { :git => "https://github.com/smallcase/react-native-smallcase-gateway.git", :tag => "#{s.version}" }
  s.vendored_frameworks = 'SCGateway.xcframework'
  s.source_files = "ios/**/*.{h,c,m,swift}"
  s.requires_arc = true

  s.dependency "React-Core"
  s.dependency 'SCGateway', '3.8.3'
end

