#![allow(dead_code)]
#![allow(unused_variables)]
#![allow(unused_imports)]

use std::time::Duration;

use hdk::prelude::*;
use holochain::{conductor::config::ConductorConfig, sweettest::*};

mod common;
use common::{create_happ, sample_happ_1};

#[tokio::test(flavor = "multi_thread")]
async fn create_a_happ_and_get_all_happs() {
    // Use prebuilt dna file
    let dna_path = std::env::current_dir().unwrap().join(
        std::env::var("DNA_PATH").expect("DNA_PATH not set, must be run using nix flake check"),
    );
    let dna = SweetDnaFile::from_bundle(&dna_path).await.unwrap();

    // Set up conductors
    let mut conductors = SweetConductorBatch::from_config(2, ConductorConfig::default()).await;
    let apps = conductors.setup_app("main", &[dna]).await.unwrap();
    conductors.exchange_peer_info().await;

    let ((alice,), (bobbo,)) = apps.into_tuples();

    let alice_zome = alice.zome("happs");
    let bob_zome = bobbo.zome("happs");

    let sample = sample_happ_1(&conductors[0], &alice_zome).await;

    // Alice creates a Happ
    let record: Record = create_happ(&conductors[0], &alice_zome, sample.clone()).await;

    await_consistency(Duration::from_secs(60), [&alice, &bobbo])
        .await
        .expect("Timed out waiting for consistency");

    let links: Vec<Link> = conductors[1].call(&bob_zome, "get_all_happs", ()).await;

    assert_eq!(links.len(), 1);
    assert_eq!(
        links[0].target.clone().into_action_hash().unwrap(),
        record.signed_action.hashed.hash
    );
}
