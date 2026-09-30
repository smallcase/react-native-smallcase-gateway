require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

# Native SDK pins live in native-sdk.json. Run `SMALLCASE_SDK_MODE=debug pod install`
# in the host app to consume debug builds of the native SDKs.
native_sdks = JSON.parse(File.read(File.join(__dir__, "native-sdk.json")))
sdk_mode = ENV.fetch("SMALLCASE_SDK_MODE", "release")
unless native_sdks.key?(sdk_mode)
  raise "react-native-smallcase-gateway: unknown SMALLCASE_SDK_MODE '#{sdk_mode}', expected one of #{native_sdks.keys}"
end
ios_sdks = native_sdks[sdk_mode]["ios"]
ios_sdks.each do |sdk, pod|
  raise "react-native-smallcase-gateway: no #{sdk} SDK pinned for mode '#{sdk_mode}' in native-sdk.json" if pod.nil?
end
folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'

Pod::Spec.new do |s|
  s.name         = "react-native-smallcase-gateway"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "11.0" }
  s.source       = { :git => "https://github.com/smallcase/react-native-smallcase-gateway.git", :tag => "#{s.version}" }
  s.vendored_frameworks = 'SCGateway.xcframework'
  s.source_files = "ios/**/*.{h,m,mm,swift}"

  s.dependency "React-Core"

  # Don't install the dependencies when we run `pod install` in the old architecture.
  if ENV['RCT_NEW_ARCH_ENABLED'] == '1' then
    s.compiler_flags = folly_compiler_flags + " -DRCT_NEW_ARCH_ENABLED=1"
    s.pod_target_xcconfig    = {
        "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\"",
        "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
    }

    s.dependency "React-Codegen"
    # RCT-Folly is provided by ReactNativeDependencies in RN 0.81+, so we don't need to declare it
    # s.dependency "RCT-Folly"
    s.dependency "RCTRequired"
    s.dependency "RCTTypeSafety"
    s.dependency "ReactCommon/turbomodule/core"
  end

  s.dependency ios_sdks["gateway"]["name"], ios_sdks["gateway"]["version"]
  s.dependency ios_sdks["loans"]["name"], ios_sdks["loans"]["version"]
end
