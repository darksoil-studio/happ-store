{ inputs, ... }:

{

  perSystem = { inputs', lib, self', system, ... }: rec {
    packages.file_storage_provider_happ =
      inputs.tnesh-stack.outputs.builders.${system}.happ {
        happManifest = ./workdir/happ.yaml;
        dnas = {
          # Include here the DNA packages for this hApp, e.g.:
          # my_dna = inputs'.some_input.packages.my_dna;
          # This overrides all the "bundled" properties for the hApp manifest
          main = self'.packages.main_dna;
          file_storage_provider = self'.packages.file_storage_provider_dna;
        };
      };

    packages.file_storage_provider_aon_debug =
      inputs.aon.outputs.builders.${system}.aon-for-happ {
        happ_bundle = packages.file_storage_provider_happ.meta.debug;
      };

    packages.file_storage_provider_aon =
      inputs.aon.outputs.builders.${system}.aon-for-happ {
        happ_bundle = packages.file_storage_provider_happ;
      };
  };
}
