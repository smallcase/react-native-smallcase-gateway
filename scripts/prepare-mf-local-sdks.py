#!/usr/bin/env python3
"""Build development SDK artifacts locally; never publishes to a remote registry."""
import argparse
import os
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'smart_investing_react_native/build/local-sdk'


def run(command, cwd, **kwargs):
    subprocess.run(command, cwd=cwd, check=True, **kwargs)


def android(source):
    output = OUT / 'android'
    output.mkdir(parents=True, exist_ok=True)
    init = OUT / 'mf-local.gradle'
    init.write_text('''gradle.projectsEvaluated {
    def sdk = rootProject.project(':smallcase_gateway')
    sdk.tasks.register('prepareMfLocalArtifact') {
        dependsOn sdk.tasks.named('bundleDebugAar')
        doLast {
            def dest = new File(System.getenv('MF_LOCAL_ANDROID_REPO'), 'com/smallcase/gateway/sdk-mf-local/0.0.0-local')
            dest.mkdirs()
            sdk.copy {
                from new File(sdk.buildDir, 'outputs/aar/smallcase_gateway-debug.aar')
                into dest
                rename { 'sdk-mf-local-0.0.0-local.aar' }
            }
            def writer = new StringWriter()
            def xml = new groovy.xml.MarkupBuilder(writer)
            xml.project {
                modelVersion('4.0.0')
                groupId('com.smallcase.gateway')
                artifactId('sdk-mf-local')
                version('0.0.0-local')
                packaging('aar')
                dependencies {
                    sdk.configurations.debugRuntimeClasspath.resolvedConfiguration.firstLevelModuleDependencies.each { dep ->
                        dependency {
                            groupId(dep.moduleGroup)
                            artifactId(dep.moduleName)
                            version(dep.moduleVersion)
                            scope('compile')
                            if (dep.moduleName == 'jjwt-orgjson') {
                                exclusions { exclusion { groupId('org.json'); artifactId('json') } }
                            }
                        }
                    }
                }
            }
            new File(dest, 'sdk-mf-local-0.0.0-local.pom').text = writer.toString()
        }
    }
}
''')
    env = dict(os.environ, MF_LOCAL_ANDROID_REPO=str(output))
    if not env.get('JAVA_HOME'):
        env['JAVA_HOME'] = subprocess.check_output(['/usr/libexec/java_home', '-v', '17'], text=True).strip()
    run(['./gradlew', '-I', str(init), ':smallcase_gateway:prepareMfLocalArtifact'], source, env=env)
    print(f'Android local Maven repository: {output}')


def ios(source, derived):
    output = OUT / 'ios'
    output.mkdir(parents=True, exist_ok=True)
    if derived is None:
        derived = OUT / 'ios-derived'
        run(['xcodebuild', '-workspace', 'smallcase_gateway/SCGateway.xcworkspace',
             '-scheme', 'SCGateway', '-configuration', 'Debug', '-sdk', 'iphonesimulator',
             '-destination', 'generic/platform=iOS Simulator', '-derivedDataPath', str(derived),
             'CODE_SIGNING_ALLOWED=NO', 'build'], source)
    framework = derived / 'Build/Products/Debug-iphonesimulator/SCGateway.framework'
    if not framework.is_dir():
        raise SystemExit(f'Missing built framework: {framework}')
    xcframework = output / 'SCGateway.xcframework'
    if xcframework.exists():
        shutil.rmtree(xcframework)
    run(['xcodebuild', '-create-xcframework', '-framework', str(framework), '-output', str(xcframework)], source)
    (output / 'SCGateway.podspec').write_text('''Pod::Spec.new do |s|
  s.name = 'SCGateway'
  s.version = '0.0.1'
  s.summary = 'Local MF Gateway simulator build'
  s.homepage = 'https://github.com/smallcase/gw-mob-ios'
  s.license = { :type => 'Proprietary' }
  s.author = 'smallcase'
  s.source = { :path => '.' }
  s.platform = :ios, '13.0'
  s.vendored_frameworks = 'SCGateway.xcframework'
end
''')
    print(f'iOS simulator-only local pod: {output}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('platform', choices=['android', 'ios', 'all'])
    parser.add_argument('--android-source', type=Path, default=ROOT.parent / 'gw-mob-android')
    parser.add_argument('--ios-source', type=Path, default=ROOT.parent / 'gw-mob-ios')
    parser.add_argument('--ios-derived', type=Path, help='Reuse an already built, up-to-date native framework')
    args = parser.parse_args()
    if args.platform in ('android', 'all'):
        android(args.android_source.resolve())
    if args.platform in ('ios', 'all'):
        ios(args.ios_source.resolve(), args.ios_derived.resolve() if args.ios_derived else None)
