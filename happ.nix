{ inputs, ... }:

{
  # Import all `dnas/*/dna.nix` files
  imports = (map (m: "${./.}/dnas/${m}/dna.nix") (builtins.attrNames
    (if builtins.pathExists ./dnas then builtins.readDir ./dnas else { })));

  perSystem = { inputs', pkgs, lib, self', system, ... }: rec {
    packages.happ-store_happ =
      inputs.tnesh-stack.outputs.builders.${system}.happ {
        happManifest = ./workdir/happ.yaml;
        dnas = {
          # Include here the DNA packages for this hApp, e.g.:
          # my_dna = inputs'.some_input.packages.my_dna;
          # This overrides all the "bundled" properties for the hApp manifest
          main = self'.packages.main_dna;
        };
      };
    packages.ui = pkgs.stdenv.mkDerivation (finalAttrs: {
      version =
        (builtins.fromJSON (builtins.readFile ./ui/package.json)).version;
      pname = "happ-store-ui";
      pnpmWorkspaces = [ "ui" "@darksoil-studio/happs-zome" ];
      src =
        (inputs.tnesh-stack.outputs.lib.cleanPnpmDepsSource { inherit lib; })
        ./.;

      nativeBuildInputs = with pkgs; [ nodejs pnpm_9.configHook git ];
      pnpmDeps = pkgs.pnpm_9.fetchDeps {
        inherit (finalAttrs) pnpmWorkspaces version pname src;
        hash = "sha256-uK9cUvza8dtq409t4HgWRuVJUhfGFHDxfkgy5QE6TQE=";
        buildInputs = [ pkgs.git ];
      };
      buildPhase = ''
        runHook preBuild

        pnpm --filter=ui build

        runHook postBuild
        mkdir $out
        cp -R ui/dist/* $out
      '';
    });

    packages.happ-store_webhapp =
      inputs.tnesh-stack.outputs.builders.${system}.webhapp {
        name = "happ-store";
        happ = packages.happ-store_happ;
        ui = packages.ui;
      };
  };
}
