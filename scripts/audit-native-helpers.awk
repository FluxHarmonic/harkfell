# The native-helper audit (topics/sigil-native-vector-field-accessor-drops-guard):
# every place sigil's native backend substituted a recognised helper's fast
# path, with its callee and the function it sits in. Sigil 0.22.6/0.22.7 took
# a helper whose body had OTHER paths too and dropped them. Read every callee
# that is not a plain define-struct accessor against its source.
#   awk -f scripts/audit-native-helpers.awk build/release/native/mod_*.c
/^static TrampolineResult sigil_native_f[0-9]+_[A-Za-z0-9_]*\(.*\{$/ {
    fn = $3; sub(/\(.*/, "", fn)
}
/_cl->code == sigil_native_f[0-9]+_[A-Za-z0-9_]*\)/ {
    match($0, /sigil_native_f[0-9]+_[A-Za-z0-9_]*/); callee = substr($0, RSTART, RLENGTH)
}
/^    _vec = sigil_native_struct_ref_slot\(vm, args\[0\], [0-9]+\);$/ {
    print FILENAME ": vector-field BODY of " fn
}
/Value _vec = sigil_native_struct_ref_slot\(vm, _call_args\[0\], [0-9]+\);$/ {
    print FILENAME ": vector-field CALL SITE of " callee " (in " fn ")"
}
/Value _stride = sigil_native_struct_ref_slot\(vm, _call_args\[0\], [0-9]+\);$/ {
    print FILENAME ": index-helper CALL SITE of " callee " (in " fn ")"
}
/^[[:space:]]*(v[0-9]+ = )?sigil_native_struct_ref_slot\(vm, _call_args\[0\], [0-9]+\);$/ {
    print FILENAME ": struct-accessor CALL SITE of " callee " (in " fn ")"
}
