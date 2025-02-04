#![allow(dead_code)]
#![allow(unused_variables)]
#![allow(unused_imports)]

use std::time::Duration;

use hdk::prelude::*;
use holochain::{conductor::config::ConductorConfig, sweettest::*};

use happs_integrity::*;

use happs::happ_version::UpdateHappVersionInput;

mod common;
use common::{create_happ_version, sample_happ_version_1, sample_happ_version_2};

use common::{create_happ, sample_happ_1, sample_happ_2};

#[tokio::test(flavor = "multi_thread")]
async fn create_happ_version_test() {
    // Use prebuilt dna file
    let dna_path = std::env::current_dir().unwrap().join(
        std::env::var("DNA_PATH").expect("DNA_PATH not set, must be run using nix flake check"),
    );
    let dna = SweetDnaFile::from_bundle(&dna_path).await.unwrap();

    // Set up conductors
    let mut conductors = SweetConductorBatch::from_config(2, ConductorConfig::default()).await;
    let apps = conductors.setup_app("main", &[dna]).await.unwrap();
    conductors.exchange_peer_info().await;

    let ((alice,), (_bobbo,)) = apps.into_tuples();

    let alice_zome = alice.zome("happs");

    let sample = sample_happ_version_1(&conductors[0], &alice_zome).await;

    // Alice creates a HappVersion
    let record: Record = create_happ_version(&conductors[0], &alice_zome, sample.clone()).await;
    let entry: HappVersion = record.entry().to_app_option().unwrap().unwrap();
    assert!(entry.eq(&sample));
}

#[tokio::test(flavor = "multi_thread")]
async fn create_and_read_happ_version() {
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

    let sample = sample_happ_version_1(&conductors[0], &alice_zome).await;

    // Alice creates a HappVersion
    let record: Record = create_happ_version(&conductors[0], &alice_zome, sample.clone()).await;

    await_consistency(Duration::from_secs(60), [&alice, &bobbo])
        .await
        .expect("Timed out waiting for consistency");

    let get_record: Option<Record> = conductors[1]
        .call(
            &bob_zome,
            "get_original_happ_version",
            record.signed_action.action_address().clone(),
        )
        .await;

    assert_eq!(record, get_record.unwrap());
}

#[tokio::test(flavor = "multi_thread")]
async fn create_and_update_happ_version() {
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

    let sample_1 = sample_happ_version_1(&conductors[0], &alice_zome).await;

    // Alice creates a HappVersion
    let record: Record = create_happ_version(&conductors[0], &alice_zome, sample_1.clone()).await;
    let original_action_hash = record.signed_action.hashed.hash.clone();

    await_consistency(Duration::from_secs(60), [&alice, &bobbo])
        .await
        .expect("Timed out waiting for consistency");

    let sample_2 = sample_happ_version_2(&conductors[0], &alice_zome).await;
    let input = UpdateHappVersionInput {
        original_happ_version_hash: original_action_hash.clone(),
        previous_happ_version_hash: original_action_hash.clone(),
        updated_happ_version: sample_2.clone(),
    };

    // Alice updates the HappVersion
    let update_record: Record = conductors[0]
        .call(&alice_zome, "update_happ_version", input)
        .await;

    let entry: HappVersion = update_record.entry().to_app_option().unwrap().unwrap();
    assert_eq!(sample_2, entry);

    await_consistency(Duration::from_secs(60), [&alice, &bobbo])
        .await
        .expect("Timed out waiting for consistency");

    let get_record: Option<Record> = conductors[1]
        .call(
            &bob_zome,
            "get_latest_happ_version",
            original_action_hash.clone(),
        )
        .await;

    assert_eq!(update_record, get_record.unwrap());

    let input = UpdateHappVersionInput {
        original_happ_version_hash: original_action_hash.clone(),
        previous_happ_version_hash: update_record.signed_action.hashed.hash.clone(),
        updated_happ_version: sample_1.clone(),
    };

    // Alice updates the HappVersion again
    let update_record: Record = conductors[0]
        .call(&alice_zome, "update_happ_version", input)
        .await;

    let entry: HappVersion = update_record.entry().to_app_option().unwrap().unwrap();
    assert_eq!(sample_1, entry);

    await_consistency(Duration::from_secs(60), [&alice, &bobbo])
        .await
        .expect("Timed out waiting for consistency");

    let get_record: Option<Record> = conductors[1]
        .call(
            &bob_zome,
            "get_latest_happ_version",
            original_action_hash.clone(),
        )
        .await;

    assert_eq!(update_record, get_record.unwrap());
}
