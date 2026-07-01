# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# SCLoans ships -repackageclasses 'com.smallcase.loans' as a consumer rule, which
# causes the host R8 to move 6 000+ external classes into com.smallcase.loans —
# colliding with the SDK's own pre-obfuscated classes and corrupting the Koin DI
# type graph at runtime (ClassCastException in wi/cm/o40 chain).
# -keeppackagenames overrides -repackageclasses per the ProGuard/R8 spec.
-keeppackagenames **

# SCGateway (com.smallcase.gateway:sdk) ships NO consumer proguard rules and its
# classes enter R8 with clear names, so the host R8 (full mode) freely obfuscates
# and merges its Dagger factories and Retrofit interfaces. That breaks
# retrofit.create(GatewayApiService) — the proxy cast fails at runtime with a
# ClassCastException routed through R8's synthetic ThrowCCE helper
# (FakeNetworkModule.provideGatewayApiService chain). Keep the SDK intact,
# mirroring the -keep that SCLoans already ships for itself.
-keep class com.smallcase.gateway.** { *; }

# Retrofit + R8 full mode (AGP 8 default): generic signatures are stripped for
# any type that is not kept, so ConfigService.getBrokerConfigs(): Call<Foo>
# degrades to a raw Call and Retrofit rejects it
# ("Call return type must be parameterized as Call<Foo>"). These are the
# canonical rules Retrofit 2.9+ bundles in META-INF/proguard/retrofit2.pro; the
# gateway SDK vendors an older Retrofit whose embedded rules never reach the host,
# so we declare them here. allowobfuscation/allowshrinking keep the types
# "kept enough" to retain their generic signatures while still letting R8 rename them.
-keepattributes Signature, InnerClasses, EnclosingMethod
-keepclassmembers,allowshrinking,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}
-keep,allowobfuscation,allowshrinking interface retrofit2.Call
-keep,allowobfuscation,allowshrinking class retrofit2.Response
-keep,allowobfuscation,allowshrinking class kotlin.coroutines.Continuation
