# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# SCGateway proguard rules — keeping it here, same as loans.
-keep class com.smallcase.gateway.** { *; }

-keep class com.example.** { *; }

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
