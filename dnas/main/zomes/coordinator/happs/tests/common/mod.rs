pub async fn sample_happ_1(conductor: &SweetConductor, zome: &SweetZome) -> Happ {
    Happ {
        name: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string(),
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string(),
        icon: ::fixt::fixt!(EntryHash),
    }
}

pub async fn sample_happ_2(conductor: &SweetConductor, zome: &SweetZome) -> Happ {
    Happ {
        name: "Lorem ipsum 2".to_string(),
        description: "Lorem ipsum 2".to_string(),
        icon: ::fixt::fixt!(EntryHash),
    }
}

pub async fn create_happ(conductor: &SweetConductor, zome: &SweetZome, happ: Happ) -> Record {
    let record: Record = conductor.call(zome, "create_happ", happ).await;
    record
}

pub async fn sample_happ_version_1(conductor: &SweetConductor, zome: &SweetZome) -> HappVersion {
    HappVersion {
        happ_hash: create_happ(conductor, zome, sample_happ_1(conductor, zome).await)
            .await
            .signed_action
            .hashed
            .hash,
        version: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string(),
        changes: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string(),
        web_happ_bundle_hash: ::fixt::fixt!(EntryHash),
    }
}

pub async fn sample_happ_version_2(conductor: &SweetConductor, zome: &SweetZome) -> HappVersion {
    HappVersion {
        happ_hash: create_happ(conductor, zome, sample_happ_2(conductor, zome).await)
            .await
            .signed_action
            .hashed
            .hash,
        version: "Lorem ipsum 2".to_string(),
        changes: "Lorem ipsum 2".to_string(),
        web_happ_bundle_hash: ::fixt::fixt!(EntryHash),
    }
}

pub async fn create_happ_version(
    conductor: &SweetConductor,
    zome: &SweetZome,
    happ_version: HappVersion,
) -> Record {
    let record: Record = conductor
        .call(zome, "create_happ_version", happ_version)
        .await;
    record
}
